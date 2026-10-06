# ---------------------------------------------------------------------------
# Cluster Kubernetes local (kind) — 1 control-plane + 1 worker.
# ---------------------------------------------------------------------------
resource "kind_cluster" "oficina" {
  name           = var.nome_cluster
  wait_for_ready = true

  kind_config {
    kind        = "Cluster"
    api_version = "kind.x-k8s.io/v1alpha4"

    node {
      role = "control-plane"
    }

    node {
      role = "worker"
    }
  }
}

# ---------------------------------------------------------------------------
# Namespace e Secret da aplicação (as chaves espelham k8s/secret.example.yaml;
# os manifestos da API em ../k8s são aplicados pelo CD por cima desta base).
# ---------------------------------------------------------------------------
resource "kubernetes_namespace_v1" "oficina" {
  metadata {
    name = "oficina"
    labels = {
      "app.kubernetes.io/part-of" = "oficina"
    }
  }
}

resource "kubernetes_secret_v1" "oficina_secrets" {
  metadata {
    name      = "oficina-secrets"
    namespace = kubernetes_namespace_v1.oficina.metadata[0].name
  }

  data = {
    APP_KEY             = var.app_key
    JWT_SECRET          = var.jwt_secret
    WEBHOOK_SECRET      = var.webhook_secret
    DB_PASSWORD         = var.senha_banco
    MYSQL_ROOT_PASSWORD = var.senha_banco
    SMTP_HOST           = var.smtp.host
    SMTP_PORT           = var.smtp.port
    SMTP_USER           = var.smtp.user
    SMTP_PASSWORD       = var.smtp.password
    MAIL_FROM           = var.smtp.mail_from
    EMAIL_ALMOXARIFE    = var.smtp.email_almoxarife
  }
}

# ---------------------------------------------------------------------------
# Banco de dados MySQL (StatefulSet + Service + volume persistente).
# Equivalente a k8s/mysql.yaml — quem provisiona por Terraform NÃO deve
# aplicar aquele manifesto.
# ---------------------------------------------------------------------------
resource "kubernetes_service_v1" "mysql" {
  metadata {
    name      = "mysql"
    namespace = kubernetes_namespace_v1.oficina.metadata[0].name
  }

  spec {
    selector = { app = "mysql" }

    port {
      port        = 3306
      target_port = 3306
    }
  }
}

resource "kubernetes_stateful_set_v1" "mysql" {
  metadata {
    name      = "mysql"
    namespace = kubernetes_namespace_v1.oficina.metadata[0].name
  }

  spec {
    service_name = kubernetes_service_v1.mysql.metadata[0].name
    replicas     = 1

    selector {
      match_labels = { app = "mysql" }
    }

    template {
      metadata {
        labels = { app = "mysql" }
      }

      spec {
        container {
          name  = "mysql"
          image = "mysql:8.0"

          port {
            container_port = 3306
          }

          env {
            name = "MYSQL_ROOT_PASSWORD"
            value_from {
              secret_key_ref {
                name = kubernetes_secret_v1.oficina_secrets.metadata[0].name
                key  = "MYSQL_ROOT_PASSWORD"
              }
            }
          }

          env {
            name  = "MYSQL_DATABASE"
            value = "oficina"
          }

          readiness_probe {
            exec {
              command = ["sh", "-c", "mysqladmin ping -h 127.0.0.1 -p\"$MYSQL_ROOT_PASSWORD\""]
            }
            initial_delay_seconds = 15
            period_seconds        = 5
            timeout_seconds       = 3
          }

          resources {
            requests = {
              cpu    = "250m"
              memory = "512Mi"
            }
            limits = {
              cpu    = "1"
              memory = "1Gi"
            }
          }

          volume_mount {
            name       = "dados"
            mount_path = "/var/lib/mysql"
          }
        }
      }
    }

    volume_claim_template {
      metadata {
        name = "dados"
      }

      spec {
        access_modes = ["ReadWriteOnce"]

        resources {
          requests = {
            storage = "2Gi"
          }
        }
      }
    }
  }
}
