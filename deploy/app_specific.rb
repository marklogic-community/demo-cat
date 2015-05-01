#
# Put your custom functions in this class in order to keep the files under lib untainted
#
# This class has access to all of the stuff in deploy/lib/server_config.rb
#
class ServerConfig
  # protect alerting when cleaning content
  alias_method :original_clean_content, :clean_content
  def clean_content()
    remove_alerting
    original_clean_content
    install_alerting
  end
  
  # add alerting when deploying content
  alias_method :original_deploy_content, :deploy_content
  def deploy_content()
    #remove_alerting
    original_deploy_content
    #install_alerting
  end
  
  # add triggers when deploying modules
  alias_method :original_deploy_modules, :deploy_modules
  def deploy_modules()
    remove_triggers
    original_deploy_modules
    install_triggers
    
    # and apply correct permissions
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
    fix_collections()
    fix_credentials()
    fix_contacts()
    fix_hosts()
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

  def fix_collections()
    logger.info "Fixing collections.."
    r = execute_query %Q{
      xquery version "1.0-ml";

      for $doc in xdmp:directory('/demos/')
      let $uri := fn:base-uri($doc)
      return (
        $uri,
        xdmp:document-set-collections($uri, ('demos'))
      ),
      for $doc in xdmp:directory('/users/')
      let $uri := fn:base-uri($doc)
      return (
        $uri,
        xdmp:document-set-collections($uri, ('users'))
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

      xdmp:invoke("/data-migration/add-credentials.xqy")
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

  def fix_hosts()
    logger.info "Fixing hosts.."
    r = execute_query %Q{
      xquery version "1.0-ml";

      xdmp:invoke("/data-migration/host-to-url.xqy")
    },
    { :app_name => @properties["ml.app-name"] }

    r.body = parse_json r.body
    logger.info r.body
  end

  def add_change_tracking()
    logger.info "Adding change tracking.."
    r = execute_query %Q{
      xquery version "1.0-ml";

      xdmp:invoke("/data-migration/add-change-tracking.xqy")
    },
    { :app_name => @properties["ml.app-name"] }

    r.body = parse_json r.body
    logger.info r.body
  end

  def remove_triggers()
    
    logger.info "Removing Triggers..\n"
    
    r = execute_query(%Q{
        xquery version "1.0-ml";
      
        import module namespace trgr="http://marklogic.com/xdmp/triggers" 
           at "/MarkLogic/triggers.xqy";
         
        xdmp:log("Installing Change Tracking triggers.."),
      
        try {
          trgr:remove-trigger("ChangeTrackingCreateTrigger")
        } catch ($ignore) { },
        try {
          trgr:remove-trigger("ChangeTrackingModifyTrigger")
        } catch ($ignore) { }
      },
      :db_name => @properties["ml.triggers-db"]
    )
  end

  def install_triggers()
    
    logger.info "Installing Triggers..\n"
    
    r = execute_query(%Q{
        xquery version "1.0-ml";
      
        import module namespace trgr="http://marklogic.com/xdmp/triggers" 
           at "/MarkLogic/triggers.xqy";
         
        trgr:create-trigger("ChangeTrackingCreateTrigger", "Trigger to add change tracking details", 
          trgr:trigger-data-event(
            trgr:directory-scope("/demos/", "infinity"),
            trgr:document-content("create"),
            trgr:pre-commit()
          ),
          trgr:trigger-module(xdmp:database("#{@properties['ml.modules-db']}"), "/", "/triggers/add-change-tracking.xqy"),
          fn:true(),
          (),
          fn:false()
        ),
      
        trgr:create-trigger("ChangeTrackingModifyTrigger", "Trigger to update change tracking details", 
          trgr:trigger-data-event(
            trgr:directory-scope("/demos/", "infinity"),
            trgr:document-content("modify"),
            trgr:pre-commit()
          ),
          trgr:trigger-module(xdmp:database("#{@properties['ml.modules-db']}"), "/", "/triggers/add-change-tracking.xqy"),
          fn:true(),
          (),
          fn:false()
        )
      },
      :db_name => @properties["ml.triggers-db"]
    )
  end
  
  def remove_alerting ()
    
    logger.info "Removing Alerting..\n"
    
    r = execute_query %Q{

      (: First delete the original triggers configuration so we can set it up newly :)
      xquery version "1.0-ml";
      import module namespace alert = "http://marklogic.com/xdmp/alert" at "/MarkLogic/alert.xqy";

      try {
        let $config := alert:config-get("http://marklogic.com/demo-cat/notifications")
        return if (fn:empty($config))
          then ()
          else alert:remove-triggers("http://marklogic.com/demo-cat/notifications")
      } catch ($e) {
        xdmp:log($e)
      };


      (: Then delete the original alerting configuration so we can set it up newly :)
      xquery version "1.0-ml";
      import module namespace alert = "http://marklogic.com/xdmp/alert" at "/MarkLogic/alert.xqy";

      try {
        let $config := alert:config-get("http://marklogic.com/demo-cat/notifications")
        return if (fn:empty($config))
          then ()
          else alert:config-delete("http://marklogic.com/demo-cat/notifications")
      } catch ($e) {
        xdmp:log($e)
      };
    },
    { :app_name => @properties["ml.app-name"] }
  end

  # install_alerting is used to define the alerting used for notifications
  def install_alerting ()
    
    logger.info "Installing Alerting..\n"
    
    r = execute_query %Q{

      (: Create the alerting configuration :)
      xquery version "1.0-ml";
      import module namespace alert = "http://marklogic.com/xdmp/alert" at "/MarkLogic/alert.xqy";

      let $config := alert:make-config(
            "http://marklogic.com/demo-cat/notifications",
            "Notifications",
            "Alerting configuration for creating notifications",
              <alert:options/> )

      return alert:config-insert($config);

      (: Create the trigger and associate it with the config :)
      xquery version "1.0-ml";
      import module namespace alert = "http://marklogic.com/xdmp/alert" at "/MarkLogic/alert.xqy";
      import module namespace trgr="http://marklogic.com/xdmp/triggers" at "/MarkLogic/triggers.xqy";


      let $trigger-ids := alert:create-triggers(
        "http://marklogic.com/demo-cat/notifications",
        trgr:trigger-data-event(
          trgr:directory-scope('/demos/', 'infinity'),
          trgr:document-content(("modify")),
          trgr:post-commit()
        )
      )

      return alert:config-insert(
               alert:config-set-trigger-ids(
                  alert:config-get("http://marklogic.com/demo-cat/notifications"),
                  $trigger-ids));


      (: Connect the send email action to the alerting configuration :)
      xquery version "1.0-ml";
      import module namespace alert = "http://marklogic.com/xdmp/alert" at "/MarkLogic/alert.xqy";

      let $action := alert:make-action(
          "send-demo-email",
          "Send an email when a demo is updated",
          xdmp:database('#{@properties["ml.modules-db"]}'),
          '/',
          "/alerting/alert-send-demo-email.xqy",
          <alert:options/> )
      return alert:action-insert("http://marklogic.com/demo-cat/notifications", $action);

      (: Connect the "demo broken" action to the alerting configuration :)
      xquery version "1.0-ml";
      import module namespace alert = "http://marklogic.com/xdmp/alert" at "/MarkLogic/alert.xqy";

      let $action2 := alert:make-action(
          "demo-broken-action",
          "Action to execute when a demo is marked as broken.",
          xdmp:database('#{@properties["ml.modules-db"]}'),
          '/',
          "/alerting/alert-demo-broken-action.xqy",
          <alert:options/> )
      return alert:action-insert("http://marklogic.com/demo-cat/notifications", $action2);


      (: Alerting rule for detecting broken demos. :)
      xquery version "1.0-ml";
      import module namespace alert = "http://marklogic.com/xdmp/alert" at "/MarkLogic/alert.xqy";
      declare namespace jbasic = "http://marklogic.com/xdmp/json/basic";

      let $rule := alert:make-rule(
          "demo-broken-rule",
          "Rule that evaluates a demo to determine if it is broken",
          0, (: equivalent to xdmp:user(xdmp:get-current-user()) :)
          cts:element-value-query(xs:QName("jbasic:status"), "Not Working"),
          "demo-broken-action",
          <alert:options>
            <alert:hostname>#{@properties["ml.referring-host"]}</alert:hostname>
          </alert:options>
          )
      return
      alert:rule-insert("http://marklogic.com/demo-cat/notifications", $rule)

      (: Consider adding any one-off Alerting rules here. :)

      },
     { :db_name => @properties["ml.content-db"] }
   end
end
