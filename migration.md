# export from old prod server
* check if deploy/dev.properties points to van-prod3
* ./ml dev mlcp export -output_file_path export -output_type archive -directory_filter /demos/,/users/

# test migrated data into local ml8
* check if deploy/local.properties points to local ml8
* ./ml local clean triggers
* ./ml local clean modules
* ./ml local clean content
* ./ml local deploy modules
* ./ml local deploy content
* ./ml local mlcp import -input_file_path export -input_file_type archive -transform_namespace "http://marklogic.com/transform/to-json" -transform_module /transform/to-json.xqy
* check data with QC
* ./ml local migrate_data -v
* check data with QC

# load migrated data into new prod server
* check if deploy/prod.properties points to new ml8 server
* ./ml prod clean triggers
* ./ml prod clean modules
* ./ml prod clean content
* ./ml prod deploy modules
* ./ml prod deploy content
* ./ml prod mlcp import -input_file_path export -input_file_type archive -transform_namespace "http://marklogic.com/transform/to-json" -transform_module /transform/to-json.xqy
* check data with QC
* ./ml prod migrate_data -v
* check data with QC
