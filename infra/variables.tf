variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "francecentral"
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "rg-formation-platform-prod"
}

variable "postgresql_server_name" {
  description = "Name of the PostgreSQL server"
  type        = string
  default     = "formation-platform-db"
}

variable "database_name" {
  description = "Name of the database"
  type        = string
  default     = "formation"
}

variable "db_admin_username" {
  description = "Database administrator username"
  type        = string
  default     = "formationadmin"
}

variable "storage_account_name" {
  description = "Name of the storage account"
  type        = string
  default     = "formationplatformstorage"
}

variable "key_vault_name" {
  description = "Name of the Key Vault"
  type        = string
  default     = "kv-formation-platform"
}

variable "log_analytics_name" {
  description = "Name of the Log Analytics workspace"
  type        = string
  default     = "log-formation-platform"
}

variable "app_insights_name" {
  description = "Name of Application Insights"
  type        = string
  default     = "appi-formation-platform"
}

variable "app_service_plan_name" {
  description = "Name of the App Service Plan"
  type        = string
  default     = "asp-formation-platform"
}

variable "app_service_name" {
  description = "Name of the App Service"
  type        = string
  default     = "formation-platform"
}

variable "azure_ad_client_id" {
  description = "Azure AD Application Client ID"
  type        = string
  default     = ""
}

variable "azure_ad_client_secret" {
  description = "Azure AD Application Client Secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "azure_ad_tenant_id" {
  description = "Azure AD Tenant ID"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default = {
    Environment = "Production"
    Project     = "Formation-Platform"
    ManagedBy   = "Terraform"
  }
}
