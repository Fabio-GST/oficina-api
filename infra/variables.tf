variable "nome_cluster" {
  description = "Nome do cluster kind"
  type        = string
  default     = "oficina"
}

variable "senha_banco" {
  description = "Senha root do MySQL (vai para o Secret oficina-secrets)"
  type        = string
  sensitive   = true
}

variable "app_key" {
  description = "APP_KEY do AdonisJS (32 caracteres aleatórios)"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "Segredo de assinatura dos tokens JWT"
  type        = string
  sensitive   = true
}

variable "webhook_secret" {
  description = "Segredo compartilhado dos webhooks (aprovação de orçamento)"
  type        = string
  sensitive   = true
}

variable "smtp" {
  description = "Credenciais SMTP (necessárias apenas com NOTIFICACAO_DRIVER=email)"
  type = object({
    host             = optional(string, "")
    port             = optional(string, "587")
    user             = optional(string, "")
    password         = optional(string, "")
    mail_from        = optional(string, "oficina@exemplo.com")
    email_almoxarife = optional(string, "")
  })
  default   = {}
  sensitive = true
}
