#
# Put your custom functions in this class in order to keep the files under lib untainted
#
# This class has access to all of the stuff in deploy/lib/server_config.rb
#
class ServerConfig
  # apply correct permissions
  alias_method :original_deploy_modules, :deploy_modules
  def deploy_modules()
    original_deploy_modules
    r = execute_query %Q{
      xquery version "1.0-ml";

      for $uri in cts:uris()
      return (
        $uri,
        xdmp:document-set-permissions($uri, (
          xdmp:permission("demo-cat-read-role", "read"),
          xdmp:permission("demo-cat-execute-role", "execute")
        ))
      )
    },
    { :db_name => @properties["ml.modules-db"] }
  end

  # fix content permissions
  def fix_permissions()
    r = execute_query %Q{
      xquery version "1.0-ml";

      for $uri in cts:uris()
      return (
        $uri,
        xdmp:document-set-permissions($uri, (
          xdmp:permission("demo-cat-read-role", "read"),
          xdmp:permission("demo-cat-insert-role", "insert"),
          xdmp:permission("demo-cat-update-role", "update")
        ))
      )
    },
    { :db_name => @properties["ml.content-db"] }
  end
end
