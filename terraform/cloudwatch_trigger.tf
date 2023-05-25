resource "aws_lambda_permission" "cloudwatch_invoke_nzb_nzbsu" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.nzb_nzbsu.arn
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.nzb_nzbsu_trigger_rate.arn
}

resource "aws_cloudwatch_event_rule" "nzb_nzbsu_trigger_rate" {
  name_prefix         = "nzb_nzbsu.rate-5-minutes."
  schedule_expression = "rate(5 minutes)"
}

resource "aws_cloudwatch_event_target" "nzb_nzbsu_trigger_target" {
  rule  = aws_cloudwatch_event_rule.nzb_nzbsu_trigger_rate.name
  arn   = aws_lambda_function.nzb_nzbsu.arn
}

//

# resource "aws_lambda_permission" "cloudwatch_invoke_nzb_backfill" {
#   statement_id  = "AllowExecutionFromCloudWatch"
#   action        = "lambda:InvokeFunction"
#   function_name = aws_lambda_function.nzb_backfill.arn
#   principal     = "events.amazonaws.com"
#   source_arn    = aws_cloudwatch_event_rule.nzb_backfill_trigger_rate.arn
# }

# resource "aws_cloudwatch_event_rule" "nzb_backfill_trigger_rate" {
#   name_prefix         = "nzb_backfill.cron-daily-23h30."
#   schedule_expression = "cron(30 23 ? * * *)"
# }

# resource "aws_cloudwatch_event_target" "nzb_backfill_trigger_target" {
#   rule  = aws_cloudwatch_event_rule.nzb_backfill_trigger_rate.name
#   arn   = aws_lambda_function.nzb_backfill.arn
# }