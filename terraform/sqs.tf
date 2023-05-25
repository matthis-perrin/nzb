resource "aws_sqs_queue" "nzb_to_check_queue" {
    name = "NzbToCheck"
}

resource "aws_lambda_event_source_mapping" "nzb_tmdb_trigger" {
  batch_size        = 1
  event_source_arn  = "${aws_sqs_queue.nzb_to_check_queue.arn}"
  enabled           = true
  function_name     = "${aws_lambda_function.nzb_tmdb.arn}"
}