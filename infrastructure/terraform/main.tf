# AlgoEdu AI — production infrastructure stub
# Choose one cloud provider module below. Do not enable both in the same workspace.

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  # Uncomment and configure remote state before production use.
  # backend "s3" {
  #   bucket = "algoedu-terraform-state"
  #   key    = "production/terraform.tfstate"
  #   region = "ap-south-1"
  # }
}

variable "environment" {
  description = "Deployment environment (staging, production)"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Resource naming prefix"
  type        = string
  default     = "algoedu"
}

variable "aws_region" {
  description = "AWS region for EKS, RDS, ElastiCache"
  type        = string
  default     = "ap-south-1"
}

variable "gcp_project_id" {
  description = "GCP project ID for GKE, Cloud SQL, Memorystore"
  type        = string
  default     = "algoedu-ai"
}

variable "gcp_region" {
  description = "GCP region"
  type        = string
  default     = "asia-south1"
}

# ---------------------------------------------------------------------------
# AWS (placeholder — enable when targeting EKS + RDS + ElastiCache)
# ---------------------------------------------------------------------------

# provider "aws" {
#   region = var.aws_region
# }
#
# module "aws_eks" {
#   source = "./modules/aws/eks"
#
#   cluster_name = "${var.project_name}-${var.environment}"
#   region       = var.aws_region
# }
#
# module "aws_rds" {
#   source = "./modules/aws/rds"
#
#   identifier   = "${var.project_name}-postgres"
#   environment  = var.environment
# }

# ---------------------------------------------------------------------------
# GCP (placeholder — enable when targeting GKE + Cloud SQL + Memorystore)
# ---------------------------------------------------------------------------

# provider "google" {
#   project = var.gcp_project_id
#   region  = var.gcp_region
# }
#
# module "gcp_gke" {
#   source = "./modules/gcp/gke"
#
#   cluster_name = "${var.project_name}-${var.environment}"
#   project_id   = var.gcp_project_id
#   region       = var.gcp_region
# }
#
# module "gcp_cloudsql" {
#   source = "./modules/gcp/cloudsql"
#
#   instance_name = "${var.project_name}-postgres"
#   project_id    = var.gcp_project_id
#   region        = var.gcp_region
# }

output "environment" {
  description = "Active environment label"
  value       = var.environment
}

output "deployment_note" {
  description = "Next steps before apply"
  value       = "Uncomment the target cloud provider blocks and add modules under infrastructure/terraform/modules/"
}
