output "nome_cluster" {
  description = "Nome do cluster kind (contexto kubectl: kind-<nome>)"
  value       = kind_cluster.oficina.name
}

output "endpoint" {
  description = "Endpoint da API do Kubernetes"
  value       = kind_cluster.oficina.endpoint
}

output "kubeconfig_path" {
  description = "Caminho do kubeconfig gerado pelo kind"
  value       = kind_cluster.oficina.kubeconfig_path
}
