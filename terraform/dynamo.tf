resource "aws_dynamodb_table" "nzb_registry_table" {
  name           = "NzbRegistry"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "guid"

  attribute {
    name = "guid"
    type = "S"
  }

  attribute {
    name = "v"
    type = "S"
  }

  attribute {
    name = "imdbId"
    type = "S"
  }

  attribute {
    name = "pubTs"
    type = "N"
  }

  attribute {
    name = "healthTs"
    type = "N"
  }

  attribute {
    name = "healthStatus"
    type = "S"
  }

  global_secondary_index {
    name               = "NzbRegistry_ByImdbId_SortedByPubTs"
    hash_key           = "imdbId"
    range_key          = "pubTs"
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "NzbRegistry_All_SortedByPubTs"
    hash_key           = "v"
    range_key          = "pubTs"
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "NzbRegistry_ByHealthFailure_SortedByHealthTs"
    hash_key           = "healthStatus"
    range_key          = "healthTs"
    projection_type    = "ALL"
  }
}

resource "aws_dynamodb_table" "nzbsu_table" {
  name           = "Nzbsu"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "guid"

  attribute {
    name = "guid"
    type = "S"
  }

  attribute {
    name = "v"
    type = "S"
  }

  attribute {
    name = "imdbId"
    type = "S"
  }

  attribute {
    name = "pubTs"
    type = "N"
  }

  attribute {
    name = "healthTs"
    type = "N"
  }

  attribute {
    name = "healthStatus"
    type = "S"
  }

  global_secondary_index {
    name               = "Nzbsu_ByImdbId_SortedByPubTs"
    hash_key           = "imdbId"
    range_key          = "pubTs"
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "Nzbsu_All_SortedByPubTs"
    hash_key           = "v"
    range_key          = "pubTs"
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "Nzbsu_ByHealthFailure_SortedByHealthTs"
    hash_key           = "healthStatus"
    range_key          = "healthTs"
    projection_type    = "ALL"
  }
}

resource "aws_dynamodb_table" "tmdb_movie_table" {
  name           = "TmdbMovie"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "N"
  }

  attribute {
    name = "imdb_id"
    type = "S"
  }

  attribute {
    name = "v"
    type = "S"
  }

  attribute {
    name = "release_date"
    type = "S"
  }

  global_secondary_index {
    name               = "TmdbMovie_All_SortedByReleaseDate"
    hash_key           = "v"
    range_key          = "release_date"
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "TmdbMovie_ByImdbId"
    hash_key           = "imdb_id"
    projection_type    = "ALL"
  }
}

resource "aws_dynamodb_table" "tmdb_tv_show_table" {
  name           = "TmdbTvShow"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "N"
  }

  attribute {
    name = "imdb_id"
    type = "S"
  }

  global_secondary_index {
    name               = "TmdbTvShow_ByImdbId"
    hash_key           = "imdb_id"
    projection_type    = "ALL"
  }
}

resource "aws_dynamodb_table" "imdb_info_table" {
  name           = "ImdbInfo"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "imdbId"

  attribute {
    name = "imdbId"
    type = "S"
  }

  attribute {
    name = "v"
    type = "S"
  }

  attribute {
    name = "bestNzbDate"
    type = "N"
  }

  attribute {
    name = "releaseDate"
    type = "N"
  }

  global_secondary_index {
    name               = "NzbRegistry_All_SortedByBestNzbDate"
    hash_key           = "v"
    range_key          = "bestNzbDate"
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "NzbRegistry_All_SortedByReleaseDate"
    hash_key           = "v"
    range_key          = "releaseDate"
    projection_type    = "ALL"
  }
}

resource "aws_dynamodb_table" "nzb_parameters_table" {
  name           = "NzbParameters"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "key"

  attribute {
    name = "key"
    type = "S"
  }
}

resource "aws_dynamodb_table" "nzb_daemon_status_table" {
  name           = "NzbDaemonStatus"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "accountId_nzbId"

  attribute {
    name = "accountId_nzbId"
    type = "S"
  }

  attribute {
    name = "accountId_imdbId"
    type = "S"
  }

  attribute {
    name = "accountId_targetState"
    type = "S"
  }

  global_secondary_index {
    name               = "NzbDaemonStatus_ByAccountIdNzbId"
    hash_key           = "accountId_nzbId"
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "NzbDaemonStatus_ByAccountIdImdbId"
    hash_key           = "accountId_imdbId"
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "NzbDaemonStatus_ByAccountIdTargetState"
    hash_key           = "accountId_targetState"
    projection_type    = "ALL"
  }
}

resource "aws_dynamodb_table" "nzb_account_table" {
  name           = "NzbAccount"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "accountId"

  attribute {
    name = "accountId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "nzbget_status_table" {
  name           = "NzbgetStatus"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "accountId"

  attribute {
    name = "accountId"
    type = "S"
  }
}