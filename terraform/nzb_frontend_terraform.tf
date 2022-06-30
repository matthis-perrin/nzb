output "nzb_frontend_cloudfront_domain_name" {
  value       = aws_cloudfront_distribution.nzb_frontend.domain_name
  description = "Domain (from cloudfront) where the \"nzb_frontend\" frontend is available."
}

module "nzb_frontend_template_files" {
  source = "hashicorp/dir/template"
  base_dir = "../nzb_frontend/dist"
}

resource "aws_s3_bucket_object" "nzb_frontend_files" {
  for_each     = module.nzb_frontend_template_files.files
  bucket       = aws_s3_bucket.code.id
  key          = "nzb_frontend/${each.key}"
  content_type = each.value.content_type
  source       = each.value.source_path
  content      = each.value.content
  etag         = each.value.digests.md5
}

resource "aws_cloudfront_distribution" "nzb_frontend" {
  origin {
    domain_name = aws_s3_bucket.code.bucket_regional_domain_name
    origin_id   = "nzb-frontend-origin-id"
    origin_path = "/nzb_frontend"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.nzb_frontend.cloudfront_access_identity_path
    }
  }
  
  enabled             = true
  wait_for_deployment = false
  is_ipv6_enabled     = true
  price_class         = "PriceClass_100"
  
  default_root_object   = "/index.html"
  custom_error_response {
    error_code         = 400
    response_code      = 200
    response_page_path = "/index.html"
  }
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  default_cache_behavior {
    allowed_methods  = ["HEAD", "GET"]
    cached_methods   = ["HEAD", "GET"]
    compress         = true
    target_origin_id = "nzb-frontend-origin-id"
    viewer_protocol_policy = "redirect-to-https"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

resource "aws_cloudfront_origin_access_identity" "nzb_frontend" {}