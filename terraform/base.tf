terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.1"
    }
  }
}

provider "aws" {
  region  = "eu-west-3"
  shared_credentials_files = ["./.aws-credentials"]
  default_tags {
    tags = {
      Project = "nzb"
    }
  }
}

data "aws_region" "current" {}
output "region" {
  value = data.aws_region.current.id
}

resource "aws_s3_bucket" "code" {
  bucket_prefix = "nzb-"
}

output "code_bucket" {
  value = aws_s3_bucket.code.id
}

data "aws_iam_policy_document" "cloudfront_access_to_code" {
  statement {
    actions   = ["s3:GetObject"]
    resources = [
      "${aws_s3_bucket.code.arn}/nzb_frontend/*",
    ]
    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.nzb_frontend.iam_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "code" {
  bucket = aws_s3_bucket.code.id
  policy = data.aws_iam_policy_document.cloudfront_access_to_code.json
}