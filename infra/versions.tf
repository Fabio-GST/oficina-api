terraform {
  required_version = ">= 1.5.0"

  required_providers {
    # Cluster Kubernetes local em containers Docker (kind).
    kind = {
      source  = "tehcyx/kind"
      version = "~> 0.9"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.38"
    }
  }
}

# O provider kubernetes é configurado com as credenciais do cluster kind
# recém-criado — nenhum kubeconfig manual é necessário.
provider "kubernetes" {
  host                   = kind_cluster.oficina.endpoint
  client_certificate     = kind_cluster.oficina.client_certificate
  client_key             = kind_cluster.oficina.client_key
  cluster_ca_certificate = kind_cluster.oficina.cluster_ca_certificate
}
