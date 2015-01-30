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

  # aks for ldap credentials
  alias_method :original_bootstrap, :bootstrap
  def bootstrap()
    if (@properties["ml.external-security"] != "")
      if (@properties["ml.ldap-user"] == "") then
        if STDIN.respond_to?(:noecho)
        print "Enter an LDAP user: "
        @properties["ml.ldap-user"] = STDIN.noecho(&:gets).chomp
        print "\n"
        else
          raise ExitException.new("Upgrade to Ruby >= 1.9 for prompting on the shell.")
        end
      end
      
      if (@properties["ml.ldap-password"] == "") then
        if STDIN.respond_to?(:noecho)
        print "Enter an LDAP password: "
        @properties["ml.ldap-password"] = STDIN.noecho(&:gets).chomp
        print "\n"
        else
          raise ExitException.new("Upgrade to Ruby >= 1.9 for prompting on the shell.")
        end
      end
    end
    
    original_bootstrap
  end
  
  # adjust REST security to allow deploy
  alias_method :original_deploy_rest, :deploy_rest
  def deploy_rest()
    if (@properties["ml.internal-security"] == "false")
      r = execute_query %Q{
        xquery version "1.0-ml"; 
      
        import module namespace admin = "http://marklogic.com/xdmp/admin" at "/MarkLogic/admin.xqy";
      
        let $config := admin:get-configuration()
        let $config := admin:appserver-set-internal-security($config, xdmp:server("#{@properties["ml.app-name"]}"), fn:true())
        return
          admin:save-configuration-without-restart($config)
      },
      { :app_name => @properties["ml.app-name"] }
    end
    
    original_deploy_rest
    
    if (@properties["ml.internal-security"] == "false")
      r = execute_query %Q{
        xquery version "1.0-ml"; 
      
        import module namespace admin = "http://marklogic.com/xdmp/admin" at "/MarkLogic/admin.xqy";
      
        let $config := admin:get-configuration()
        let $config := admin:appserver-set-internal-security($config, xdmp:server("#{@properties["ml.app-name"]}"), fn:false())
        return
          admin:save-configuration-without-restart($config)
      },
      { :app_name => @properties["ml.app-name"] }
    end
  end
  
  def migrate_data()
    fix_permissions()
    fix_credentials()
    fix_contacts()
  end
  
  # fix content permissions
  def fix_permissions()
    logger.info "Fixing permissions.."
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
    { :app_name => @properties["ml.app-name"] }
    
    r.body = parse_json r.body
    logger.debug r.body
  end
  
  def fix_credentials()
    logger.info "Fixing credentials.."
    r = execute_query %Q{
      xquery version "1.0-ml";
      
      xdmp:invoke("/data-transforms/add-credentials.xqy")
    },
    { :app_name => @properties["ml.app-name"] }
    
    r.body = parse_json r.body
    logger.info r.body
  end
  
  def fix_contacts()
    logger.info "Fixing contacts.."
    r = execute_query %Q{
      xquery version "1.0-ml";
      
      xdmp:invoke("/data-migration/maintainer-to-tech-contact.xqy")
    },
    { :app_name => @properties["ml.app-name"] }
    
    r.body = parse_json r.body
    logger.info r.body
  end
  
end
