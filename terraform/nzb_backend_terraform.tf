# Define any extra role for the lambda here
data "aws_iam_policy_document" "lambda_nzb_backend_extra_role" {
  statement {
    actions   = ["dynamodb:*"]
    resources = [
      "arn:aws:dynamodb:eu-west-3:*:table/NzbRegistry",
      "arn:aws:dynamodb:eu-west-3:*:table/NzbRegistry/index/*",
      "arn:aws:dynamodb:eu-west-3:*:table/ImdbInfo",
      "arn:aws:dynamodb:eu-west-3:*:table/ImdbInfo/index/*",
      "arn:aws:dynamodb:eu-west-3:*:table/NzbDaemonStatus",
      "arn:aws:dynamodb:eu-west-3:*:table/NzbDaemonStatus/index/*",
    ]
  }
}

resource "aws_lambda_function" "nzb_backend" {
  function_name     = "nzb_backend-API"
  s3_bucket         = aws_s3_bucket.code.id
  s3_key            = aws_s3_bucket_object.nzb_backend_archive.id
  source_code_hash  = data.archive_file.nzb_backend_archive.output_sha
  handler           = "main.handler"
  runtime           = "nodejs14.x"
  role              = aws_iam_role.lambda_nzb_backend_exec.arn
}

resource "aws_iam_role" "lambda_nzb_backend_exec" {
  name = "nzb_backend-API-assume-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Effect    = "Allow"
        Sid       = ""
      },
    ]
  })

  inline_policy {
    name = "nzb_backend-API-cloudwatch-role"
    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Action   = [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ]
          Effect   = "Allow"
          Resource = "arn:aws:logs:*:*:*"
        },
      ]
    })
  }
  
  inline_policy {
    name = "nzb_backend-API-extra-role"
    policy = data.aws_iam_policy_document.lambda_nzb_backend_extra_role.json
  }
}

data "archive_file" "nzb_backend_archive" {
  type        = "zip"
  source_dir  = "../nzb_backend/dist"
  output_path = "./archives/nzb_backend.zip"
}

resource "aws_s3_bucket_object" "nzb_backend_archive" {
  bucket       = aws_s3_bucket.code.id
  key          = "nzb_backend/dist.zip"
  source       = data.archive_file.nzb_backend_archive.output_path
  etag         = data.archive_file.nzb_backend_archive.output_sha
}

output "nzb_backend_api_url" {
  value = aws_api_gateway_deployment.nzb_backend.invoke_url
  description = "URL where the \"nzb_backend\" lambda api can be called."
}

resource "aws_api_gateway_rest_api" "nzb_backend" {
  name        = "nzb_backend-RestAPI"
  description = "Rest API for the \"nzb_backend\" app"
}

resource "aws_api_gateway_resource" "nzb_backend" {
  rest_api_id = aws_api_gateway_rest_api.nzb_backend.id
  parent_id   = aws_api_gateway_rest_api.nzb_backend.root_resource_id
  path_part   = "{proxy+}"
}
  
resource "aws_api_gateway_method" "nzb_backend" {
  rest_api_id   = aws_api_gateway_rest_api.nzb_backend.id
  resource_id   = aws_api_gateway_resource.nzb_backend.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "nzb_backend_root" {
    rest_api_id   = aws_api_gateway_rest_api.nzb_backend.id
    resource_id   = aws_api_gateway_rest_api.nzb_backend.root_resource_id
    http_method   = "ANY"
    authorization = "NONE"
}

resource "aws_api_gateway_integration" "nzb_backend" {
  rest_api_id = aws_api_gateway_rest_api.nzb_backend.id
  resource_id = aws_api_gateway_method.nzb_backend.resource_id
  http_method = aws_api_gateway_method.nzb_backend.http_method
  
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.nzb_backend.invoke_arn
}

resource "aws_api_gateway_integration" "nzb_backend_root" {
  rest_api_id = aws_api_gateway_rest_api.nzb_backend.id
  resource_id = aws_api_gateway_method.nzb_backend_root.resource_id
  http_method = aws_api_gateway_method.nzb_backend_root.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.nzb_backend.invoke_arn
}

resource "aws_api_gateway_deployment" "nzb_backend" {
  depends_on = [
    aws_api_gateway_integration.nzb_backend,
    aws_api_gateway_integration.nzb_backend_root,
  ]
  rest_api_id = aws_api_gateway_rest_api.nzb_backend.id
  stage_name  = "prod"

  triggers = {
    redeployment = sha1(jsonencode(aws_api_gateway_integration.nzb_backend))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lambda_permission" "nzb_backend" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.nzb_backend.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.nzb_backend.execution_arn}/*/*"
}