terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region  = "eu-west-3"
  shared_credentials_file = "./.aws-credentials"
  default_tags {
    tags = {
      Project = "nzb"
    }
  }
}

resource "aws_s3_bucket" "code" {
  bucket_prefix = "nzb-"
}

resource "aws_s3_bucket_acl" "code_bucket_acl" {
  bucket = aws_s3_bucket.code.id
  acl    = "private"
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