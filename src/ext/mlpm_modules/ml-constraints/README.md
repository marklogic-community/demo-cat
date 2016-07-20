# ml-constraints

Pre-built custom search constraints that go beyond what the MarkLogic REST API provides OOTB

## Install

Installation depends on the [MarkLogic Package Manager](https://github.com/joemfb/mlpm):

```
$ mlpm install ml-constraint --save
$ mlpm deploy
```

## additional-query-constraint

This custom constraint can be wrapped around any existing search constraint to apply an additional query that only applies to that search constraint (and its facet values).

### Usage

Take an existing search constraint in your REST api query options, and put the following after the open tag `<constraint name="myconstraint">`:

    <custom>
      <parse apply="parse-structured" ns="http://marklogic.com/additional-query-constraint" at="/ext/mlpm_modules/ml-constraints/additional-query-constraint.xqy"/>
      <start-facet apply="start" ns="http://marklogic.com/additional-query-constraint" at="/ext/mlpm_modules/ml-constraints/additional-query-constraint.xqy"/>
      <finish-facet apply="finish" ns="http://marklogic.com/additional-query-constraint" at="/ext/mlpm_modules/ml-constraints/additional-query-constraint.xqy"/>
    </custom>
    <annotation>

Put the following before the closing tag `</constraint>`:

      <additional-query>
      </additional-query>
    </annotation>

Inside additional query you can insert any serialized cts:query, for instance a cts:collection-query:

    <cts:collection-query xmlns:cts="http://marklogic.com/cts">
      <cts:uri>examples</cts:uri>
    </cts:collection-query>

E.g. this:

    <constraint name="myconstraint">
    
      <range collation="http://marklogic.com/collation/" type="xs:string" facet="true">
        <element ns="http://some-ns.com/example" name="myexample"/>
        <facet-option>frequency-order</facet-option>
        <facet-option>descending</facet-option>
        <facet-option>limit=10</facet-option>
      </range>
    
    </constraint>

would become:

    <constraint name="myconstraint">
      <custom>
        <parse apply="parse-structured" ns="http://marklogic.com/additional-query-constraint" at="/ext/mlpm_modules/ml-constraints/additional-query-constraint.xqy"/>
        <start-facet apply="start" ns="http://marklogic.com/additional-query-constraint" at="/ext/mlpm_modules/ml-constraints/additional-query-constraint.xqy"/>
        <finish-facet apply="finish" ns="http://marklogic.com/additional-query-constraint" at="/ext/mlpm_modules/ml-constraints/additional-query-constraint.xqy"/>
      </custom>
      <annotation>
      
        <range collation="http://marklogic.com/collation/" type="xs:string" facet="true">
          <element ns="http://some-ns.com/example" name="myexample"/>
          <facet-option>frequency-order</facet-option>
          <facet-option>descending</facet-option>
          <facet-option>limit=10</facet-option>
        </range>
        
        <additional-query>
          <cts:collection-query xmlns:cts="http://marklogic.com/cts">
            <cts:uri>examples</cts:uri>
          </cts:collection-query>
        </additional-query>
      </annotation>
    </constraint>

### Known issues

- This constraint only implements a parse-structured method, and is therefore only supported by the REST api. The parse-string approach does not pass through the full query options, which is essential in this case
- Custom constraints currently only support `EQ` comparison, e.g. `myconstraint:somevalue`, and **not** `myconstraint GT somevalue` (RFE has been filed)
- Due to a bug/limitation of the REST api parse-structured-style constraint are not supported by /v1/suggest (Bug has been filed)

## dynamic-buckets-constraint

This custom constraint can be wrapped around any existing range constraint to apply dynamic buckets, based on min/max or number of buckets.

### Usage

Take an existing range constraint in your REST api query options, and put the following after the open tag `<constraint name="myconstraint">`:

    <constraint name="myconstraint">
      <custom facet="true">
        <parse apply="parse-structured" ns="http://marklogic.com/dynamic-buckets-constraint" at="/ext/mlpm_modules/ml-constraints/dynamic-buckets-constraint.xqy"/>
        <start-facet apply="start" ns="http://marklogic.com/dynamic-buckets-constraint" at="/ext/mlpm_modules/ml-constraints/dynamic-buckets-constraint.xqy"/>
        <finish-facet apply="finish" ns="http://marklogic.com/dynamic-buckets-constraint" at="/ext/mlpm_modules/ml-constraints/dynamic-buckets-constraint.xqy"/>
      </custom>
      <annotation>

Put the following before the closing tag `</constraint>`:

        <config xmlns="http://marklogic.com/dynamic-buckets-constraint">
          <min>1996</min>
          <max>2016</max>
        </config>
      </annotation>
    </constraint>

Inside additional query you can insert any serialized cts:query, for instance a cts:collection-query:


E.g. this:

    <constraint name="myconstraint">
    
      <range type="xs:date" facet="true">
        <facet-option>item-order</facet-option>
        <facet-option>ascending</facet-option>
        <element ns="some-ns.com/example" name="date"/>
      </range>
    
    </constraint>

would become:

    <constraint name="myconstraint">
      <custom facet="true">
        <parse apply="parse-structured" ns="http://marklogic.com/dynamic-buckets-constraint" at="/ext/mlpm_modules/ml-constraints/dynamic-buckets-constraint.xqy"/>
        <start-facet apply="start" ns="http://marklogic.com/dynamic-buckets-constraint" at="/ext/mlpm_modules/ml-constraints/dynamic-buckets-constraint.xqy"/>
        <finish-facet apply="finish" ns="http://marklogic.com/dynamic-buckets-constraint" at="/ext/mlpm_modules/ml-constraints/dynamic-buckets-constraint.xqy"/>
      </custom>
      <annotation>
      
        <range type="xs:date" facet="true">
          <facet-option>item-order</facet-option>
          <facet-option>ascending</facet-option>
          <element ns="some-ns.com/example" name="date"/>
        </range>
        
        <config xmlns="http://marklogic.com/dynamic-buckets-constraint">
          <min>1996</min>
          <max>2016</max>
        </config>
      </annotation>
    </constraint>

Note: min/max are only used for xs:date range constraints, and represent minimum year, and maximum year for which buckets are supposed to be generated. If the actual minimum or maximum goes beyond, first and/or last bucket name is prepended with the ≤ resp ≥ character. All other range constraint data types currently ignore min/max and take nr-buckets instead. A fixed number of buckets (defaulting to 10) is created, evenly spread between actual min and max.

## grouping-constraint

This custom constraint can be wrapped around any existing search constraint to apply grouping of values leveraging value-match patterns.

### Usage

Take an existing search constraint in your REST api query options, and put the following after the open tag `<constraint name="myconstraint">`:

    <custom>
      <parse apply="parse-structured" ns="http://marklogic.com/grouping-constraint" at="/ext/mlpm_modules/ml-constraints/grouping-constraint.xqy"/>
      <start-facet apply="start" ns="http://marklogic.com/grouping-constraint" at="/ext/mlpm_modules/ml-constraints/grouping-constraint.xqy"/>
      <finish-facet apply="finish" ns="http://marklogic.com/grouping-constraint" at="/ext/mlpm_modules/ml-constraints/grouping-constraint.xqy"/>
    </custom>
    <annotation>

Put the following before the closing tag `</constraint>`:

      <config>
        <show-remainder label="Other"/>
      </config>
    </annotation>

Inside config you can insert groups, and provide multiple match patterns for each as follows:

    <group label="A-M">
      <match pattern="A*"/>
      <match pattern="B*"/>
      <match pattern="C*"/>
      <match pattern="D*"/>
      <match pattern="E*"/>
      <match pattern="F*"/>
      <match pattern="G*"/>
      <match pattern="H*"/>
      <match pattern="I*"/>
      <match pattern="J*"/>
      <match pattern="K*"/>
      <match pattern="L*"/>
      <match pattern="M*"/>
    </group>
    <group label="N-Z">
      <match pattern="N*"/>
      <match pattern="O*"/>
      <match pattern="P*"/>
      <match pattern="Q*"/>
      <match pattern="R*"/>
      <match pattern="S*"/>
      <match pattern="T*"/>
      <match pattern="U*"/>
      <match pattern="V*"/>
      <match pattern="W*"/>
      <match pattern="X*"/>
      <match pattern="Y*"/>
      <match pattern="Z*"/>
    </group>

E.g. this:

    <constraint name="myconstraint">
    
      <range collation="http://marklogic.com/collation/" type="xs:string" facet="true">
        <element ns="http://some-ns.com/example" name="myexample"/>
        <facet-option>frequency-order</facet-option>
        <facet-option>descending</facet-option>
        <facet-option>limit=10</facet-option>
      </range>
    
    </constraint>

would become:

    <constraint name="myconstraint">
      <custom>
        <parse apply="parse-structured" ns="http://marklogic.com/grouping-constraint" at="/ext/mlpm_modules/ml-constraints/grouping-constraint.xqy"/>
        <start-facet apply="start" ns="http://marklogic.com/grouping-constraint" at="/ext/mlpm_modules/ml-constraints/grouping-constraint.xqy"/>
        <finish-facet apply="finish" ns="http://marklogic.com/grouping-constraint" at="/ext/mlpm_modules/ml-constraints/grouping-constraint.xqy"/>
      </custom>
      <annotation>
      
        <range collation="http://marklogic.com/collation/" type="xs:string" facet="true">
          <element ns="http://some-ns.com/example" name="myexample"/>
          <facet-option>frequency-order</facet-option>
          <facet-option>descending</facet-option>
          <facet-option>limit=10</facet-option>
        </range>
        
        <config>
          <group label="A-M">
            <match pattern="A*"/>
            <match pattern="B*"/>
            <match pattern="C*"/>
            <match pattern="D*"/>
            <match pattern="E*"/>
            <match pattern="F*"/>
            <match pattern="G*"/>
            <match pattern="H*"/>
            <match pattern="I*"/>
            <match pattern="J*"/>
            <match pattern="K*"/>
            <match pattern="L*"/>
            <match pattern="M*"/>
          </group>
          <group label="N-Z">
            <match pattern="N*"/>
            <match pattern="O*"/>
            <match pattern="P*"/>
            <match pattern="Q*"/>
            <match pattern="R*"/>
            <match pattern="S*"/>
            <match pattern="T*"/>
            <match pattern="U*"/>
            <match pattern="V*"/>
            <match pattern="W*"/>
            <match pattern="X*"/>
            <match pattern="Y*"/>
            <match pattern="Z*"/>
          </group>
          <show-remainder label="Other"/>
        </config>
      </annotation>
    </constraint>

### Known issues

- This constraint only implements a parse-structured method, and is therefore only supported by the REST api. The parse-string approach does not pass through the full query options, which is essential in this case
- Custom constraints currently only support `EQ` comparison, e.g. `myconstraint:somevalue`, and **not** `myconstraint GT somevalue` (RFE has been filed)
- Due to a bug/limitation of the REST api parse-structured-style constraint are not supported by /v1/suggest (Bug has been filed)
