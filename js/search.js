// When the user clicks on the search box, we want to toggle the search dropdown
function displayToggleSearch(e) {
  e.preventDefault();
  e.stopPropagation();

  closeDropdownSearch(e);
  
  if (idx === null) {
    console.log("Building search index...");
    prepareIdxAndDocMap();
    console.log("Search index built.");
  }
  const dropdown = document.querySelector("#search-dropdown-content");
  if (dropdown) {
    if (!dropdown.classList.contains("show")) {
      dropdown.classList.add("show");
    }
    document.addEventListener("click", closeDropdownSearch);
    document.addEventListener("keydown", searchOnKeyDown);
    document.addEventListener("keyup", searchOnKeyUp);
  }
}

//We want to prepare the index only after clicking the search bar
var idx = null
const docMap = new Map()

function prepareIdxAndDocMap() {
  const docs = [  
    {
      "title": "Backward Chaining",
      "url": "/docs/phases/backwardChaining",
      "content": "Backward Chaining Backward Chaining is also an inference method as well as the previous described Forward Chaining which purpose is to generate new knowledge from the implicit knowledge of a Knowledge Graph. The main difference between both is that Backward Chaining works backwards the goal, what makes it less intuitive respect to the Forward Chaining. It also uses semantic rules to make the inference happen. See Artificial Intelligence: A Modern Approach - Stuart J.Russell and Peter Norvig - Chapter 9.4 for more info. Let’s take a look at an example: Example Use Case We will use the same use case as in Forward Chaining, where a user want’s to infer all the people from the knowledge graph: Query PREFIX rdf: &lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#&gt; PREFIX class: &lt;http://example.org/class/&gt; SELECT ?person WHERE { ?person rdf:type class:Person } KG +-------------------------------+-------------------------------------------------+------------------------------------+ |s |p |o | +-------------------------------+-------------------------------------------------+------------------------------------+ |&lt;http://example.org/data/Alice&gt;|&lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#type&gt;|&lt;http://example.org/class/Biologist&gt;| |&lt;http://example.org/data/Bob&gt; |&lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#type&gt;|&lt;http://example.org/class/Engineer&gt; | +-------------------------------+-------------------------------------------------+------------------------------------+ Ontology +------------------------------------+-------------------------------------------------+-------------------------------------+ |s |p |o | +------------------------------------+-------------------------------------------------+-------------------------------------+ |&lt;http://example.org/class/Person&gt; |&lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#type&gt;|&lt;http://www.w3.org/2002/07/owl#Class&gt;| |&lt;http://example.org/class/Biologist&gt;|&lt;http://www.w3.org/2000/01/rdf-schema#subClassOf&gt;|&lt;http://example.org/class/Person&gt; | |&lt;http://example.org/class/Engineer&gt; |&lt;http://www.w3.org/2000/01/rdf-schema#subClassOf&gt;|&lt;http://example.org/class/Person&gt; | +------------------------------------+-------------------------------------------------+-------------------------------------+ RDFS entailment Rdfs9: IF THEN +---------------------------+--------------------+ |uuu rdfs:subClassOf xxx . | vvv rdf:type xxx . | |vvv rdf:type uuu . | | +---------------------------+--------------------+ Backward Chaining explained The first thing we should do for Backward Chaining is identifying the objective, in this we can look at the query and see that the objective is: ?person rdf:type class:Person, by taking a look at the Rdfs9 at the rhs we can see that it matches the objective vvv rdf:type xxx, so we can make the following substitution: Rdfs9 (rhs substitution): IF THEN +---------------------------+---------------------------------+ |uuu rdfs:subClassOf xxx . | ?person rdf:type class:Person . | |vvv rdf:type uuu . | | +---------------------------+---------------------------------+ Subs: vvv -&gt; ?person xxx = { class:Person } Then we can go backwards to the lhs of the entailment and perform the pertinent substitutions: Rdfs9 (lhs substitution): IF THEN +------------------------------------+---------------------------------+ |uuu rdfs:subClassOf class:Person . | ?person rdf:type class:Person . | |?person rdf:type uuu . | | +------------------------------------+---------------------------------+ Subs: vvv -&gt; ?person xxx = { class:Person } Query Rewrite We can’t go any further with substitutions. But what we can do is replace the BGP triple of the user query with the substituted lhs of the entailment. It will look like this: PREFIX rdf: &lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#&gt; PREFIX class: &lt;http://example.org/class/&gt; SELECT ?person WHERE { ?uuu rdfs:subClassOf class:Person . ?person rdf:type ?uuu . } We see that uuu has been substituted for ?uuu. It is easy to reason that the solution set for ?uuu are ?uuu = { class:Biologist, class:Engineer }. Now if we trigger this modified query we would get as part of the solution set Alice and Bob. But notice that if it where any instance or node tagged explicitly as class:Person it wouldn’t be retrieved by this query, so we need to add another thing to the query, the objective or rhs in the form of a UNION statement: PREFIX rdf: &lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#&gt; PREFIX class: &lt;http://example.org/class/&gt; SELECT ?person WHERE { { ?uuu rdfs:subClassOf class:Person . ?person rdf:type ?uuu . } UNION { ?person rdf:type class:Person . } } Now this query is will return all the people in the knowledge graph. ?person = { :Alice, :Bob } To do this query rewrite we make use of recursion-schemes. See Techniques section."
    } ,    
    {
      "title": "Combine Flat BGPs",
      "url": "/docs/phases/optimization/combineFlatBgps",
      "content": "Combine Flat BGPs When a query is parsed into the internal DAG representation it could end having multiple levels of nested BGPs when combining path (property expressions) nodes and quads nodes. Example PREFIX : &lt;http://example.org/&gt; SELECT * WHERE { ?a :knows+ ?b . ?c :knows|:knows ?d . ?b :knows ?c . ?f :knows ?g . ?d :knows/:knows ?f . } The following DAG is generated after parsing the query: Project( List(VARIABLE(?a), VARIABLE(?b), VARIABLE(?c), VARIABLE(?d), VARIABLE(?f), VARIABLE(?g)), BGP( List( Path(VARIABLE(?a),OneOrMore(Uri(&lt;http://example.org/knows&gt;)),VARIABLE(?b),List(GRAPH_VARIABLE)), Path(VARIABLE(?c),Alternative(Uri(&lt;http://example.org/knows&gt;),Uri(&lt;http://example.org/knows&gt;)),VARIABLE(?d),List(GRAPH_VARIABLE)), BGP( List( Quad(VARIABLE(?b),URIVAL(&lt;http://example.org/knows&gt;),VARIABLE(?c),List(GRAPH_VARIABLE)), Quad(VARIABLE(?f),URIVAL(&lt;http://example.org/knows&gt;),VARIABLE(?g),List(GRAPH_VARIABLE)) ) ), Path(VARIABLE(?d),SeqExpression(Uri(&lt;http://example.org/knows&gt;),Uri(&lt;http://example.org/knows&gt;)),VARIABLE(?f),List(GRAPH_VARIABLE)) ) ) ) We can see how we have nested BGPs, after applying the Combine Flat BGPs phase to the DAG: Project( List(VARIABLE(?a), VARIABLE(?b), VARIABLE(?c), VARIABLE(?d), VARIABLE(?f), VARIABLE(?g)), BGP( List( Path(VARIABLE(?a),OneOrMore(Uri(&lt;http://example.org/knows&gt;)),VARIABLE(?b),List(GRAPH_VARIABLE)), Path(VARIABLE(?c),Alternative(Uri(&lt;http://example.org/knows&gt;),Uri(&lt;http://example.org/knows&gt;)),VARIABLE(?d),List(GRAPH_VARIABLE)), Quad(VARIABLE(?b),URIVAL(&lt;http://example.org/knows&gt;),VARIABLE(?c),List(GRAPH_VARIABLE)), Quad(VARIABLE(?f),URIVAL(&lt;http://example.org/knows&gt;),VARIABLE(?g),List(GRAPH_VARIABLE)), Path(VARIABLE(?d),SeqExpression(Uri(&lt;http://example.org/knows&gt;),Uri(&lt;http://example.org/knows&gt;)),VARIABLE(?f),List(GRAPH_VARIABLE)) ) ) )"
    } ,    
    {
      "title": "Compilation",
      "url": "/docs/compilation",
      "content": "Compilation The process of querying the underlying Spark DataFrame is dictated by SPARQL algebra. Bellman expects a three- (or four-) column DataFrame representing an RDF graph, in which the first column represents the subject, the second one the predicate, and the third one the object. It’s optional to add a fourth column representing the graph to which the edge belongs. Basic Example What we do in Bellman is: for each triple in the Basic Graph Pattern (BGP), we query the DataFrame, and then join them given their common variables, for example: PREFIX doc: &lt;http://example.com/doc#&gt; PREFIX rdf: &lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#&gt; SELECT ?d ?author WHERE { ?d rdf:type doc:Document . ?d doc:Author ?author . } This query selects documents with their author. In Bellman we query once per triple, so starting with the first triple: ?d rdf:type doc:Document We will query the DataFrame like this: val triple1Result = df.select($\"p\" === \"&lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#type&gt;\" &amp;&amp;&amp; $\"o\" === \"&lt;http://example.com/doc#Document&gt;\": _*) And for the second triple we will do: val triple2Result = df.select($\"$p\" === \"&lt;http://example.com/doc#Author&gt;\": _*) Finally, with these two values, we will join them on the common variables, in this case the ?d column only: val result = triple1Result.join(triple2Result, \"s\") This is a simple example of how a SPARQL query is compiled into Spark code. Under the hood, the compiler performs a sequence of Phases like transforming the query into an internal AST representation. Finally, this AST will be evaluated with a bottom-up strategy."
    } ,    
    {
      "title": "Configuration",
      "url": "/docs/configuration",
      "content": "Configuration The Bellman engine uses some configuration settings that will affect its behavior. The defaults are defined in Bellman’s reference.conf file, and can be overridden in your project’s application.conf according to the standard Lightbend config rules. You can also override the loaded config in your application or shell by declaring an implicit as a modified copy of the default, for example: import com.gsk.kg.config._ implicit val config = Config.default.copy(defaultGraphMode = DefaultGraphMode.Inclusive) The configuration settings are: default-graph-mode: This setting will tell the Bellman engine how to construct the default graph. There are two ways in which the Bellman engine can behave, inclusive or exclusive. The inclusive behavior will add all the defined graphs in the DataFrame to the default graph. This means that there is no need for a FROM statement as all the graphs are included. The exclusive behavior will not add any graphs to the default graph. So we must explicitly tell the engine in the query using the FROM statement, on which graphs should the query apply. See default graph demystified for further explanation on inclusive/exclusive behaviors. Note that the selected behavior could affect the output of the query and also its performance. The default value of the flag is exclusive. Note that the deprecated API method sparql() uses inclusive mode regardless of configuration; use inclusive() or exclusive() instead, or Compiler.compile() to use the configured mode. strip-question-marks-on-output: This flag will tell the Bellman engine whether to strip question marks off the DataFrame columns header. The default value for this flag is false. format-rdf-output: This flag will tell the Bellman engine whether it should apply formatting to the output DataFrame. The default value for this flag is true. inference-mode: This setting will tell the Bellman engine how to infer results that can be inferred from the ontology provided. Available values are: none: Will perform no inference. forward-chaining: Will perform inference with forward-chaining approach. forward-chaining-auto: Will perform inference with forward-chaining approach, and only evaluate RDFS rules or OWL axioms that are defined in the inferenceEntailments flag and that are applicable based on the analysis of the query and the ontology. backward-chaining: Will perform inference with backward-chaining approach. backward-chaining-auto: Will perform inference with backward-chaining approach, and only evaluate RDFS rules and OWL axioms that are defined in the inferenceEntailments flag and that are applicable based on the analysis of the query and the ontology. full-auto: Will perform inference with forward-chaining and backward-chaining depending on the RDFS rules or OWL axioms, and only evaluate those that are defined in the inferenceEntailments flag and that are applicable based on the analysis of the query and the ontology. The default value for this setting is none. inference-entailments: This setting specifies the RDFS rules or OWL axioms that can be used for inference. It sets a constraint on the inference-mode. Available values are: rdfs-2 rdfs-3 rdfs-5 (transitive) rdfs-7 rdfs-9 rdfs-11 (transitive) owl-cax-eqc-1 owl-cax-eqc-2 owl-scm-cls owl-scm-eqc-1 owl-scm-eqc-2 owl-scm-sym owl-eq-sym owl-eq-trans (transitive) owl-eq-rep-s owl-eq-rep-p owl-eq-rep-o owl-prp-eqp1 owl-prp-eqp2 owl-scm-eqp1 owl-scm-eqp2 Further information about RDFS entailments and OWL axioms can be found in these links: RDFS Entailments OWL Axioms"
    } ,    
    {
      "title": "DataFrame Typer",
      "url": "/docs/phases/dataframeTyper",
      "content": "DataFrame Typer This phase transforms and splits the input SPO or SPOG columns of the DataFrame into a Spark struct with multiple fields. Column Struct value: Holds the value. type: Holds the type. lang: Holds the language. Example Here we see an example DataFrame untyped and typed with its corresponding schemas. Untyped DataFrame +-------------------------------+-------------------------------------------------+------------------------------------+ |s |p |o | +-------------------------------+-------------------------------------------------+------------------------------------+ |&lt;http://example.org/data/Alice&gt;|&lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#type&gt;|&lt;http://example.org/class/Biologist&gt;| |&lt;http://example.org/data/Bob&gt; |&lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#type&gt;|&lt;http://example.org/class/Engineer&gt; | +-------------------------------+-------------------------------------------------+------------------------------------+ root |-- s: string (nullable = true) |-- p: string (nullable = true) |-- o: string (nullable = true) Typed DataFrame +-------------------------------------------------------------------------+-------------------------------------------------------------------------------------------+------------------------------------------------------------------------------+ |s |p |o | +-------------------------------------------------------------------------+-------------------------------------------------------------------------------------------+------------------------------------------------------------------------------+ |[http://example.org/data/Alice, http://www.w3.org/2001/XMLSchema#anyURI,]|[http://www.w3.org/1999/02/22-rdf-syntax-ns#type, http://www.w3.org/2001/XMLSchema#anyURI,]|[http://example.org/class/Biologist, http://www.w3.org/2001/XMLSchema#anyURI,]| |[http://example.org/data/Bob, http://www.w3.org/2001/XMLSchema#anyURI,] |[http://www.w3.org/1999/02/22-rdf-syntax-ns#type, http://www.w3.org/2001/XMLSchema#anyURI,]|[http://example.org/class/Engineer, http://www.w3.org/2001/XMLSchema#anyURI,] | +-------------------------------------------------------------------------+-------------------------------------------------------------------------------------------+------------------------------------------------------------------------------+ root |-- s: struct (nullable = true) | |-- value: string (nullable = true) | |-- type: string (nullable = false) | |-- lang: null (nullable = true) |-- p: struct (nullable = false) | |-- value: string (nullable = true) | |-- type: string (nullable = false) | |-- lang: null (nullable = true) |-- o: struct (nullable = false) | |-- value: string (nullable = true) | |-- type: string (nullable = true) | |-- lang: string (nullable = true)"
    } ,    
    {
      "title": "Domain/Range Use Case",
      "url": "/docs/inference/domain-range",
      "content": "Domain/Range Use Case Here we will show two small similar use cases where we will use inference over two RDFS predicates, rdfs:domain and rdfs:range. Example We have an ontology with two classes and one property defined; the property has as rdfs:domain the class:Book and as rdfs:range the class:Person. In the knowledge graph we have only one triple that relates two instances data:Alice with data:Book1 by the predicate defined as a property in the ontology prop:author. First we are going to apply the entailment RDFS2 to predicate rdfs:domain and see what triples are materialized. Rdfs2: IF THEN +---------------------------+--------------------+ |aaa rdfs:domain xxx . | uuu rdf:type xxx . | |uuu aaa yyy . | | +---------------------------+--------------------+ And now we are going to apply the entailment RDFS3 to predicate rdfs:range and see also what triples are materialized. Rdfs3: IF THEN +---------------------------+--------------------+ |aaa rdfs:range xxx . | vvv rdf:type xxx . | |uuu aaa vvv . | | +---------------------------+--------------------+ We can see that two new triples have been materialized in the knowledge graph: data:Book1 rdf:type class:Book . data:Alice rdf:type class:Person . Now if we run the following query: PREFIX rdf: &lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#&gt; PREFIX class: &lt;http://example.org/class/&gt; SELECT ?book WHERE { ?book rdf:type class:Book } The result will contain data:Book1 because of RDFS2. And if we run this one: PREFIX rdf: &lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#&gt; PREFIX class: &lt;http://example.org/class/&gt; SELECT ?person WHERE { ?person rdf:type class:Person } The result will contain data:Alice because of RDFS3."
    } ,    
    {
      "title": "Engine",
      "url": "/docs/phases/engine",
      "content": "Engine The Engine phase receives the optimized query graph DAG, the DataFrame with the knowledge graph plus the Ontology and operate by traversing the query DAG in a bottom-up way and transform it into as Spark Jobs."
    } ,    
    {
      "title": "Equivalent Class Use Case",
      "url": "/docs/inference/equivalentClass",
      "content": "Equivalent Class Use Case In this use case we will see how we can infer new knowledge by applying some OWL axioms to an owl:equivalentClass predicate, and in what scenarios this can be useful. Example We have an ontology where we have defined two classes: class:Person and class:Employee, and a relation in which we specify that class:Employee is owl:equivalentClass to class:Person. Now, let’s take a look at the data defined in the knowledge graph. We see two nodes: data:Alice and data:Bob, where data:Alice is of rdf:type class:Person and data:Bob is of rdf:type class:Employee. OWL Cax-eqc1 Now we are going to apply an OWL axiom called cax-eqc1: IF THEN +------------------------------+--------------------+ |c1 owl:equivalentClass c2 . | x rdf:type c2 . | |x rdf:type c1 . | | +------------------------------+--------------------+ We can see a new materialized triple data:Bob rdf:type class:Person. Now if we run the following query: PREFIX rdf: &lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#&gt; PREFIX class: &lt;http://example.org/class/&gt; SELECT ?person WHERE { ?person rdf:type class:Person } The solution will contain data:Alice, but also data:Bob thanks to the inference. OWL Cax-eqc2 Now we are going to apply an OWL axiom called cax-eqc2: IF THEN +------------------------------+--------------------+ |c1 owl:equivalentClass c2 . | x rdf:type c1 . | |x rdf:type c2 . | | +------------------------------+--------------------+ We can see a new materialized triple data:Alice rdf:type class:Employee. Now if we run the following query: PREFIX rdf: &lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#&gt; PREFIX class: &lt;http://example.org/class/&gt; SELECT ?employee WHERE { ?employee rdf:type class:Employee } The solution will contain data:Bob, but also data:Alice thanks to the inference. OWL Scm-eqc1 and Scm-eqc2 This set of rules relates the owl:equivalentClass predicate with rdfs:subClassOf. Scm-eqc1: IF THEN +------------------------------+-------------------------+ |c1 owl:equivalentClass c2 . | c1 rdfs:subClassOf c2 . | | | c2 rdfs:subClassOf c1 . | +------------------------------+-------------------------+ Scm-eqc2: IF THEN +--------------------------+-----------------------------+ |c1 rdfs:subClassOf c2 . | c1 owl:equivalentClass c2 . | |c2 rdfs:subClassOf c1 . | | +--------------------------+-----------------------------+ This is useful for the Subclass Use Case, to materialize new relations on the ontology before applying the RDFS11. Here is an example of what would be materialized in this particular ontology with Scm-eqc1:"
    } ,    
    {
      "title": "Equivalent Property Use Case",
      "url": "/docs/inference/equivalentProperty",
      "content": "Equivalent Property Use Case In this use case we will see how we can infer new knowledge by applying some OWL axioms to an owl:equivalentProperty predicate, and in what scenarios this can be useful. Example We have an ontology where we have defined two properties: foaf:name and foaf:givenName, and a relation in which we specify that foaf:name is owl:equivalentProperty to foaf:givenName. Now, let’s take a look at the data defined in the knowledge graph. We see two nodes: data:Alice and data:Bob, where data:Alice has foaf:name \\\"Alice\\\" and data:Bob has foaf:givenName \\\"Bob\\\". OWL Prp-eqp1 Now we are going to apply an OWL axiom called prp-eqp1: IF THEN +--------------------------------+-------------+ |p1 owl:equivalentProperty p2 . | x p2 y . | |x p1 y . | | +--------------------------------+-------------+ We can see a new materialized triple data:Alice foaf:givenName \\\"Alice\\\". Now if we run the following query: PREFIX foaf: &lt;http://xmlns.com/foaf/0.1/&gt; SELECT ?person WHERE { ?person foaf:givenName ?name } The solution will contain data:Alice and data:Bob thanks to the inference, and not only data:Bob as would happen with no inference. OWL Prp-eqp2 Now we are going to apply an OWL axiom called pr-eqp2: IF THEN +--------------------------------+-------------+ |p1 owl:equivalentProperty p2 . | x p1 y . | |x p2 y . | | +--------------------------------+-------------+ We can see a new materialized triple data:Bob foaf:name \\\"Bob\\\". Now if we run the following query: PREFIX foaf: &lt;http://xmlns.com/foaf/0.1/&gt; SELECT ?person WHERE { ?person foaf:name ?name } The solution will contain data:Bob and data:Alice thanks to the inference, and not only data:Alice as would happen with no inference. OWL Scm-eqp1 and Scm-eqp2 This set of rules relates the owl:equivalentProperty predicate with rdfs:subPropertyOf. Scm-eqp1: IF THEN +---------------------------------+----------------------------+ |p1 owl:equivalentProperty p2 . | p1 rdfs:subPropertyOf p2 . | | | p2 rdfs:subPropertyOf p1 . | +---------------------------------+----------------------------+ Scm-eqp2: IF THEN +-----------------------------+--------------------------------+ |p1 rdfs:subPropertyOf p2 . | p1 owl:equivalentProperty p2 . | |p2 rdfs:subPropertyOf p1 . | | +-----------------------------+--------------------------------+ This is useful for the Subproperty Use Case, to materialize new relations on the ontology before applying the RDFS5. Here is an example of what would be materialized in this particular ontology with Scm-eqp1:"
    } ,    
    {
      "title": "Forward Chaining",
      "url": "/docs/phases/forwardChaining",
      "content": "Forward Chaining Forward Chaining is a technique to generate or materialize new knowledge from the implicit knowledge of a Knowledge Base, in this case a Knowledge Graph. It is one of the main two methods of reasoning along with Backward Chaining. We can define it from a logical perspective as a repeated application of modus ponens (If/Then rules). See Artificial Intelligence: A Modern Approach - Stuart J.Russell and Peter Norvig - Chapter 9.3 for more info. To see how it works let’s take look to an example. Example Use Case Let’s suppose a user want’s to do this query: PREFIX rdf: &lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#&gt; PREFIX class: &lt;http://example.org/class/&gt; SELECT ?person WHERE { ?person rdf:type class:Person } The purpose of this query would be to retrieve all the people that is tagged as class:Person in Knowledge Graph. So let’s image that the Knowledge Graph contains the following graph: KG +-------------------------------+-------------------------------------------------+------------------------------------+ |s |p |o | +-------------------------------+-------------------------------------------------+------------------------------------+ |&lt;http://example.org/data/Alice&gt;|&lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#type&gt;|&lt;http://example.org/class/Biologist&gt;| |&lt;http://example.org/data/Bob&gt; |&lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#type&gt;|&lt;http://example.org/class/Engineer&gt; | +-------------------------------+-------------------------------------------------+------------------------------------+ We can see that if triggered this query it will be no results as there is no explicit people tagged as class:Person. Ontology But now let’s introduce an Ontology where we have a class hierarchy like this: +------------------------------------+-------------------------------------------------+-------------------------------------+ |s |p |o | +------------------------------------+-------------------------------------------------+-------------------------------------+ |&lt;http://example.org/class/Person&gt; |&lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#type&gt;|&lt;http://www.w3.org/2002/07/owl#Class&gt;| |&lt;http://example.org/class/Biologist&gt;|&lt;http://www.w3.org/2000/01/rdf-schema#subClassOf&gt;|&lt;http://example.org/class/Person&gt; | |&lt;http://example.org/class/Engineer&gt; |&lt;http://www.w3.org/2000/01/rdf-schema#subClassOf&gt;|&lt;http://example.org/class/Person&gt; | +------------------------------------+-------------------------------------------------+-------------------------------------+ With the knowledge provided by this Ontology we see that class:Engineer and class:Biologist are subclasses of class:Person thus, we can infer that any person that is tagged as class:Biologist or class:Engineer in the knowledge graph are also people of class:Person. We can then conclude that we need some method to make this implicit knowledge explicit and therefore the user query can then return Alice and Bob as part of the solution set. We are going to see how with Forward Chaining technique it is possible to make this knowledge explicit. RDFS entailment To make this possible we also need another piece, a semantic language that provides the modus ponens (rules If/Then) that will allow to perform the inference. For this particular example we will use RDFS and specifically the Rdfs9 entailment. Rdfs9: IF THEN +---------------------------+--------------------+ |uuu rdfs:subClassOf xxx . | vvv rdf:type xxx . | |vvv rdf:type uuu . | | +---------------------------+--------------------+ Forward Chaining explained So we have the user query, the knowledge graph, the Ontology and the semantic entailment Rdfs9. We have all the pieces to perform the Forward Chaining. To make that knowledge explicit we need to materialize it as new triples, shown as the red arrows in the following diagram: To create those red triples in the graph we have to apply the Rdfs9 entailment. And the key is that when the lhs (If part) of the entailment is satisfied by the Ontology plus the KG, then we can materialize the rhs (Then part) of the entailment, notice that the red triples match the rhs. This is the way Forward Chaining works and why it is called like that also. If the lhs is satisfied, then the rhs is materialized in the graph. To do so we can perform a Construct query that we will call Rdfs9 Query: PREFIX rdf: &lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#&gt; PREFIX rdfs: &lt;http://www.w3.org/2000/01/rdf-schema#&gt; CONSTRUCT { ?z rdf:type ?y } WHERE { ?x rdfs:subClassOf ?y . ?z rdf:type ?x . } The WHERE corresponds statement to the IF and the CONSTRUCT statement to the THEN of the entailment. If we perform the queries in this order: Rdfs9 Query User Query We then infer that Alice and Bob are part of the solution set of the user query. ?person = { :Alice, :Bob } The Bellman engine implement a similar approach but slightly different under the hood in order to obtain a substantial performance boost."
    } ,    
    {
      "title": "Graphs Pushdown",
      "url": "/docs/phases/optimization/graphsPushdown",
      "content": "Graphs Pushdown SPARQL allows users to query specific graphs instead of all graphs by using named graphs and the GRAPH statement, for example: SELECT * FROM NAMED &lt;http://example.com/named-graph&gt; { GRAPH &lt;http://example.com/named-graph&gt; { ?s &lt;http://example.com/predicate&gt; ?o } } By default, GRAPH is captured as a scan node in the DAG. This phase pushes down the graph info to the child quad nodes, so they can be evaluated independently without global info about the graph, and removes the scan node. Here is an animation of how this is done: We use that information as any other element from the triple when querying the underlying DataFrame."
    } ,    
    {
      "title": "Getting Started",
      "url": "/docs/howto",
      "content": "Getting Started Overview The Bellman engine can be used to evaluate SPARQL queries in Spark in three main ways: interactively in a Scala REPL console in your local environment; interactively in a Spark shell on a cluster; programmatically as a dependency of your project. Using Bellman interactively Prerequisites sbt 1.6+ For Scala 2.11.x: A local installation of Spark 2.4.4 For Scala 2.12.x: A local installation of Spark 3.1.2 In Scala REPL Clone Bellman from its repository and go to the root of the project directory. From there, run the following command: sbt bellman-spark-engine/console A Scala REPL will open and run some initial commands. You can then parse the snippets from the Examples section into the console. In Spark shell On a Spark cluster, you can run Spark in client mode using the spark-shell command, and specifying the Bellman package in Maven format in the --packages option, or passing it as a jar in the --jars option. You can then use the Bellman API in the same way as with the REPL, However no initial commands will run upon startup so you’ll need to set up your Spark context, custom Config etc. in the shell. For example: spark-shell \\ --packages com.github.gsk-aiops:bellman-spark-engine_2.11:3.0.0 \\ --repositories https://oss.sonatype.org/content/repositories/releases/ \\ --num-executors 400 import com.gsk.kg.config._ import com.gsk.kg.config.DefaultGraphMode._ implicit val config = Config.default.copy(defaultGraphMode = Inclusive) ... Using Bellman programmatically You can also use the Bellman engine in your project by adding it as an external dependency. To do so, add it to build.sbt with a provided Spark dependency: libraryDependencies ++= Seq( \"com.github.gsk-aiops\" %% \"bellman-spark-engine\" % Versions(\"sparql-engine\"), \"org.apache.spark\" %% \"spark-sql\" % Versions(\"spark\") % Provided ) With that done, you can use the Compiler interface to trigger queries: Compiler.compile(kg, None, query, config) Examples Now let’s look at some snippets we can run: Basic Query Example val kg: DataFrame = List( ( \"&lt;http://example.org/data/Alice&gt;\", \"&lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#type&gt;\", \"&lt;http://example.org/class/Biologist&gt;\" ), ( \"&lt;http://example.org/data/Bob&gt;\", \"&lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#type&gt;\", \"&lt;http://example.org/class/Engineer&gt;\" ) ).toDF(\"s\", \"p\", \"o\") val query = \"\"\" |PREFIX rdf: &lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#&gt; | |SELECT ?person ?job |WHERE { | ?person rdf:type ?job |} |\"\"\".stripMargin val result = Compiler.compile(kg, None, query, config) result.right.get.show(false) This snippet will return the following output: +-------------------------------+------------------------------------+ |?person |?job | +-------------------------------+------------------------------------+ |&lt;http://example.org/data/Alice&gt;|&lt;http://example.org/class/Biologist&gt;| |&lt;http://example.org/data/Bob&gt; |&lt;http://example.org/class/Engineer&gt; | +-------------------------------+------------------------------------+ Query with inference In this case we perform a query that will return inferred results using Forward Chaining. To do so we must also provide an Ontology (schema). See the inference section for further info. val schema = List( ( \"&lt;http://example.org/class/Person&gt;\", \"&lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#type&gt;\", \"&lt;http://www.w3.org/2002/07/owl#Class&gt;\" ), ( \"&lt;http://example.org/class/Biologist&gt;\", \"&lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#type&gt;\", \"&lt;http://www.w3.org/2002/07/owl#Class&gt;\" ), ( \"&lt;http://example.org/class/Biologist&gt;\", \"&lt;http://www.w3.org/2000/01/rdf-schema#subClassOf&gt;\", \"&lt;http://example.org/class/Person&gt;\" ), ( \"&lt;http://example.org/class/Engineer&gt;\", \"&lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#type&gt;\", \"&lt;http://www.w3.org/2002/07/owl#Class&gt;\" ), ( \"&lt;http://example.org/class/Engineer&gt;\", \"&lt;http://www.w3.org/2000/01/rdf-schema#subClassOf&gt;\", \"&lt;http://example.org/class/Person&gt;\" ) ).toDF(\"s\", \"p\", \"o\") val kg: DataFrame = List( ( \"&lt;http://example.org/data/Alice&gt;\", \"&lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#type&gt;\", \"&lt;http://example.org/class/Biologist&gt;\" ), ( \"&lt;http://example.org/data/Bob&gt;\", \"&lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#type&gt;\", \"&lt;http://example.org/class/Engineer&gt;\" ) ).toDF(\"s\", \"p\", \"o\") val query = \"\"\" |PREFIX rdf: &lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#&gt; |PREFIX class: &lt;http://example.org/class/&gt; | |SELECT ?person |WHERE { | ?person rdf:type class:Person |} |\"\"\".stripMargin val result = Compiler.compile(kg, Some(schema), query, config.copy(inferenceMode = ForwardChaining)) result.right.get.show(false) This snippet will return the following output: +-------------------------------+ |?person | +-------------------------------+ |&lt;http://example.org/data/Bob&gt; | |&lt;http://example.org/data/Alice&gt;| +-------------------------------+ These snippets are run with a default implicit configuration, but you can declare your own to override it. See the configuration documentation for further information. Alternative APIs Bellman provides an API to compile a query on a Spark DataFrame in either inclusive or exclusive default graph mode, with the following syntax: kg.inclusive(query).show(false) kg.exclusive(query).show(false) Note that the deprecated API method sparql() uses inclusive mode regardless of configuration; use inclusive() or exclusive() instead, or Compiler.compile() to use the configured mode. For debugging purposes, Bellman also provides a SPARQL interpolator that creates an Expr AST from a string query: sparql\"\"\" PREFIX rdf: &lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#&gt; PREFIX class: &lt;http://example.org/class/&gt; SELECT ?person WHERE { ?person rdf:type class:Person } \"\"\" This will return the following Expr AST: Select( ArrayBuffer(VARIABLE(?person)), Project( ArrayBuffer(VARIABLE(?person)), BGP( List( Quad( VARIABLE(?person), URIVAL(&lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#type&gt;), URIVAL(&lt;http://example.org/class/Person&gt;), List(GRAPH_VARIABLE) ) ) ) ) )"
    } ,      
    {
      "title": "Inference",
      "url": "/docs/inference",
      "content": "Inference Inference is a way of reasoning so that new explicit knowledge is generated from the implicit knowledge contained within the data. The Bellman engine is capable of doing this inference in two different ways: Forward Chaining Backward Chaining In this section we will demonstrate some use cases where inference could be of great value: Subclass Use Case Subproperty Use Case Domain/Range Use Case Equivalent Class Use Case Equivalent Property Use Case"
    } ,    
    {
      "title": "Intersect Entailments",
      "url": "/docs/phases/intersectEntailments",
      "content": "Intersect Entailments This phase intersects the RDFS entailments and OWL axioms that has been inferred from the Query Entailment Analyzer and the Schema Entailment Analyzer phases. Example Suppose we have the following query: PREFIX rdf: &lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#&gt; PREFIX class: &lt;http://example.org/class/&gt; SELECT ?person WHERE { ?person rdf:type class:Person } And the following Ontology: +-------------------------------+---------------------------------------------+---------------------------------+ |s |p |o | +-------------------------------+---------------------------------------------+---------------------------------+ |&lt;http://xmlns.com/foaf/0.1/age&gt;|&lt;http://www.w3.org/2000/01/rdf-schema#domain&gt;|&lt;http://example.org/class/Person&gt;| +-------------------------------+---------------------------------------------+---------------------------------+ So after the Query Entailment Analyzer phase, we will have that this are the suitable rules to be applied: Rdfs2 Rdfs3 Rdfs9 Rdfs11 OwlCaxEqc1 OwlCaxEqc2 And after the Schema Entailment Analyzer phase, we will have the following rules: Rdfs2 So after the Intersect Entailments phase is evaluated we will obtain: Rdfs2 It is the only rule suitable to be applied, as is the only rule that is suitable for both previous phases."
    } ,    
    {
      "title": "Intro",
      "url": "/docs/intro",
      "content": "Intro Bellmin is an engine written in Scala that evaluates SPARQL 1.1 queries and executes them over RDF data stored in a Spark cluster. It relies on Apache Jena to parse the SPARQL queries, and on recursion-schemes library Droste to compile the SPARQL algebra into Spark instructions. It can perform inference reasoning when provided with an ontology defined in the RDFS and OWL semantic languages."
    } ,    
    {
      "title": "Join BGPs",
      "url": "/docs/phases/optimization/joinBgps",
      "content": "Join BGPs In SPARQL, when you write a BGP with several triples, there’s an implicit JOIN operation between them: SELECT ?person ?acuaintance WHERE { ?person rdf:type foaf:Person . ?person foaf:knows ?acquaintance . } In this query, we’re asking for all acquaintances of persons, and under the hood we’re first querying for all triples that have p == \"rdf:type\" and o == \"foaf:Person\" (effectively looking for all persons), and then we’re querying for all triples that have p == \"foaf:knows\". Once we have both results, we link them using a JOIN by their common variables, ?person in this case. A join node may be useful in some cases, such as when joining the results of a query on the default graph with results from a query on the named graph. But for BGPs it doesn’t make a lot of sense, so we remove the join node and simply join all triples from both BGPs into one: You can see in the figure above that there is a join node that ties together the BGP from the named graph and the one from the default graph. After our graphs pushdown optimization it doesn’t make sense anymore, so we remove that node by joining the BGPs into a single one. This optimization opens the door to further performance improvements because once we put all triples into the same BGP, it becomes subject to BGP compaction."
    } ,      
    {
      "title": "Optimizer",
      "url": "/docs/phases/optimizer",
      "content": "Optimizer We perform some transformations of the DAG with the purpose of optimizing the Spark job that will be triggered when the query is evaluated. In addition, some optimizations also pushes down the DAG tree some information necessary to evaluate all the nodes independently that otherwise it would be more difficult to gather by keeping some kind of state through the entire DAG evaluation. Eg: Graphs Pushdown and Subquery Pushdown phases. The optimizations are performed in the following order: Graphs Pushdown Join BGPs Combine Flat BGPs Reorder BGPs Remove Nested Project Subquery Pushdown Example In this animation we can see the before and after a DAG optimization being performed."
    } ,    
    {
      "title": "Parse Query",
      "url": "/docs/phases/parser",
      "content": "Parse Query This phase transforms the SPARQL query string into an internal representation Expr AST. This Expr AST is the representation of the SPARQL Algebra. We relly on Apache Jena to convert the SPARQL query into the SPARQL Algebra, that produces a LISP like string. After that transformation, a new parsing of the SPARQL Algebra is performed with Fastparse library to produce our internal AST representation. We can see some example: SPARQL query (plain string): PREFIX foaf: &lt;http://xmlns.com/foaf/0.1/&gt; PREFIX ex: &lt;http://example.org/&gt; SELECT ?s WHERE { ?s foaf:name \"Alice\" . ?s foaf:knows ex:Bob . } SPARQL Algebra (Apache Jena): (project (?s) (bgp (triple ?s &lt;http://xmlns.com/foaf/0.1/name&gt; \"Alice\") (triple ?s &lt;http://xmlns.com/foaf/0.1/knows&gt; &lt;http://example.org/Bob&gt;) )) AST (Expr internal representation): Project( ArrayBuffer(VARIABLE(?s)), BGP( List( Quad( VARIABLE(?s), URIVAL(&lt;http://xmlns.com/foaf/0.1/name&gt;), STRING(Alice), List(GRAPH_VARIABLE) ), Quad( VARIABLE(?s), URIVAL(&lt;http://xmlns.com/foaf/0.1/knows&gt;), URIVAL(&lt;http://example.org/Bob&gt;), List(GRAPH_VARIABLE) ) ) ) )"
    } ,    
    {
      "title": "Phases",
      "url": "/docs/phases",
      "content": "Phases Bellman is architected as a “nanopass” compiler, using Recursion Schemes as a framework. The main phases are: Parse Query transforms query strings into an Expr AST. Transform to Graph creates the DAG for handling internally. Static Analysis performs some analysis on the query to reject bad queries. Optimizer runs optimizations on the DAG. Validate DataFrame validates the columns of a DataFrame, so it matches the SPO or SPOG shape. Query Entailment Analyzer analyzes the query to determine what entailments/axioms are applicable. Ontology Entailment Analyzer analyzes the ontology to determine what entailments/axioms are applicable. Intersect Entailments intersects the entailments/axioms from the query and schema analyzer phases. Forward Chaining performs forward-chaining inference on the query results. Backward Chaining performs backward-chaining inference on the query results. DataFrame Typer types the DataFrame by holding a struct in each column of the SPOG triples. Engine actually runs the query in Spark. RDF Formatter converts the result to a DataFrame with RDF formatted values. Architecture The following diagram shows the sequential flow of the phases. On the left is the main flow, and on the right are the details of the different phases."
    } ,    
    {
      "title": "Query Entailment Analyzer",
      "url": "/docs/phases/queryEntailmentAnalyzer",
      "content": "Query Entailment Analyzer Query Entailment Analyzer phase is part of the inference flow, it will infer, based on the input query, what RDFS entailments and OWL axioms are suitable to be applied, this way it will boost the performance of reasoning by not performing all the rules when ever possible. This rule inference is constrained to only be applied to those rules (entailments/axioms) that has been set on the configuration, and when the inference mode of the engine is set to one of the Auto modes (ForwardChainingAuto, BackwardChainingAuto and FullAuto). if other mode is selected it will apply all the rules defined by the inferenceEntailments flag. Example In the BGP of this query we only have the rdf:type predicate. What this is that means that the triples that will be returned from the inference flow will only be those that have been materialized with the rdf:type. PREFIX rdf: &lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#&gt; PREFIX class: &lt;http://example.org/class/&gt; SELECT ?person WHERE { ?person rdf:type class:Person } The rules that can materialize triples with that predicate rdf:type are: Rdfs2 IF THEN +----------------------+--------------------+ |aaa rdfs:domain xxx . | uuu rdf:type xxx . | |uuu aaa yyy . | | +----------------------+--------------------+ Rdfs3 IF THEN +----------------------+--------------------+ |aaa rdfs:range xxx . | vvv rdf:type xxx . | |uuu aaa vvv . | | +----------------------+--------------------+ Rdfs9 IF THEN +---------------------------+--------------------+ |uuu rdfs:subClassOf xxx . | vvv rdf:type xxx . | |vvv rdf:type uuu . | | +---------------------------+--------------------+ Rdfs11 IF THEN +---------------------------+---------------------------+ |uuu rdfs:subClassOf vvv . | uuu rdfs:subClassOf xxx . | |vvv rdfs:subClassOf xxx . | | +---------------------------+---------------------------+ OwlCaxEqc1 IF THEN +-----------------------------+-----------------+ |c1 owl:equivalentClass c2 . | x rdf:type c2 . | |x rdf:type c1 . | | +-----------------------------+-----------------+ OwlCaxEqc2 IF THEN +-----------------------------+-----------------+ |c1 owl:equivalentClass c2 . | x rdf:type c1 . | |x rdf:type c2 . | | +-----------------------------+-----------------+ What all these rules have in common is that in the rhs (THEN part), they materialize triples that match the predicate of the triple in the query BGP (rdf:type), except for the transitive rule Rdfs11. As a consequence of the hypothetical execution of some rules that at a first glance analysis are not suitable to be applied by the Query Entailment Analyzer phase, it could lead to the materialization of some triples that will after be used to feed other rules, that are suitable of materializing triples with the rdf:type predicate. Because of this reason the solution set may not be complete when using Auto modes. This is the case between Rdfs11 and Rdfs9. Rdfs11 can materialize triples with predicate rdfs:subClassOf that can feed Rdfs9 that materializes triples with rdf:type predicate. If Rdfs11 were not added as to be a suitable rule for the example query, we will be loosing some solutions from the final inferred solution set. This kind of interactions can also happen between other rules that hasn’t been contemplated by the moment."
    } ,    
    {
      "title": "RDF Formatter",
      "url": "/docs/phases/rdfFormatter",
      "content": "RDF Formatter The RDF Formatter phase runs after the results have been received back from Spark, and transforms the result typed DataFrame with the results of the query to adapt it to the constraints that RDF has on values. It does some conversions, such as transforming numbers from their int representation 1 to their RDF one \"1\"^^xsd:int. See RDF spec for info about RDF syntax."
    } ,    
    {
      "title": "Remove Nested Project",
      "url": "/docs/phases/optimization/removeNestedProject",
      "content": "Remove Nested Project This optimization removes form the DAG the project nodes that are consecutive and have the same variable bindings. This is because the Apache Jena parser generates duplicate project SPARQL algebra statements. Example PREFIX ex: &lt;http://example.org/&gt; SELECT ?doc WHERE { ?doc a ex:Document . ?doc ex:source \"source1\" . } This query will produce the following DAG before the Remove Nested Project phase: Project( List(VARIABLE(?doc)), Project( List(VARIABLE(?doc)), BGP( List( Quad(VARIABLE(?doc),URIVAL(&lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#type&gt;),URIVAL(&lt;http://example.org/Document&gt;),List(URIVAL())), Quad(VARIABLE(?doc),URIVAL(&lt;http://example.org/source&gt;),STRING(source1),List(URIVAL())) ) ) ) ) And after the phase is applied we will have the following DAG: Project( List(VARIABLE(?doc)), BGP( List( Quad(VARIABLE(?doc),URIVAL(&lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#type&gt;),URIVAL(&lt;http://example.org/Document&gt;),List(URIVAL())), Quad(VARIABLE(?doc),URIVAL(&lt;http://example.org/source&gt;),STRING(source1),List(URIVAL())) ) ) )"
    } ,    
    {
      "title": "Reorder BPGs",
      "url": "/docs/phases/optimization/reorderBgps",
      "content": "Reorder BGPs This phase reorders the triples inside a BGP so that it minimizes the number of cross joins performed. To do this we must detect the shared variables between triples and then order the triples so that we maximize the number of adjacent triples that share variables. This is done by creating a graph of triples in which the nodes correspond to triples, and the edges between nodes indicate the presence of at least one shared variable between two triples. Then, in order to create an ordered list of triples in which shared variable triples are maximized, a BFS is performed starting from the first triple in the BGP and accumulating the result. Example Suppose this query where we have a BGP with three triples: SELECT * WHERE { ?a foaf:knows ?b . ?c foaf:knows ?d . ?b foaf:knows ?c . } Their ordering will produce one cross join between the first triple ?a foaf:konws ?b and the second triple ?c foaf:knows ?d because they don’t share variables. But if we reorder the BGP triples by changing the order between the second triple and third triple: SELECT * WHERE { ?a foaf:knows ?b . ?b foaf:knows ?c . ?c foaf:knows ?d . } Then we don’t have any cross joins because all adjacent triples contain at least one shared variable. When the DAG is transformed into Spark code, this will be resolved as inner joins. This is because the DAG is evaluated bottom-up, as the triples are internally contained in a list and folded from the last element to the first."
    } ,    
    {
      "title": "Schema Entailment Analyzer",
      "url": "/docs/phases/schemaEntailmentAnalyzer",
      "content": "Schema Entailment Analyzer Similar to the Query Entailment Analyzer phase, the Schema Entailment Analyzer phase will infer what RDFS entailments and OWL axioms are suitable of being applied, but this time based on the Ontology (schema). Once again, this rule inference is constrained to only be applied to those rules (entailments/axioms) that has been set on the configuration, and when the inference mode of the engine is set to one of the Auto modes (ForwardChainingAuto, BackwardChainingAuto and FullAuto). if other mode is selected it will apply all the rules defined by the inferenceEntailments flag. Example The following Ontology has been set up: +---------------------------------------------+-------------------------------------------------+------------------------------------------+ |s |p |o | +---------------------------------------------+-------------------------------------------------+------------------------------------------+ |&lt;http://example.org/class/Author&gt; |&lt;http://www.w3.org/2000/01/rdf-schema#subClassOf&gt;|&lt;http://example.org/class/Person&gt; | |&lt;http://example.org/class/Biologist&gt; |&lt;http://www.w3.org/2000/01/rdf-schema#subClassOf&gt;|&lt;http://example.org/class/Person&gt; | |&lt;http://example.org/class/Engineer&gt; |&lt;http://www.w3.org/2000/01/rdf-schema#subClassOf&gt;|&lt;http://example.org/class/Person&gt; | |&lt;http://example.org/class/Principal_Engineer&gt;|&lt;http://www.w3.org/2000/01/rdf-schema#subClassOf&gt;|&lt;http://example.org/class/Senior_Engineer&gt;| +---------------------------------------------+-------------------------------------------------+------------------------------------------+ Based on this Ontology we can infer that the following rules: Rdfs9 IF THEN +---------------------------+--------------------+ |uuu rdfs:subClassOf xxx . | vvv rdf:type xxx . | |vvv rdf:type uuu . | | +---------------------------+--------------------+ Rdfs11 IF THEN +---------------------------+---------------------------+ |uuu rdfs:subClassOf vvv . | uuu rdfs:subClassOf xxx . | |vvv rdfs:subClassOf xxx . | | +---------------------------+---------------------------+ OwlScmEqc2 IF THEN +-------------------------+-----------------------------+ |c1 rdfs:subClassOf c2 . | c1 owl:equivalentClass c2 . | |c2 rdfs:subClassOf c1 . | | +-------------------------+-----------------------------+ Are suitable of materializing new triples when applied. We can see that unlike the Query Entailment Analyzer this time we have to focus on the lhs (IF part) of the rules, where the rules suitable for being applied are the ones that contains predicates that are also contained in the Ontology. For this particular case the rdfs:subClassOf predicate. For this phase you should be aware that it will do an exploration over the Ontology by querying it. If the Ontology is larger enough it will have an impact in the performance, you can avoid this exploration by not setting the configuration inference mode flag to any of the Auto modes (BackwardChainingAuto, ForwardChainingAuto or FullAuto)."
    } ,      
    {
      "title": "Static Analysis",
      "url": "/docs/phases/staticAnalysis",
      "content": "Static Analysis In this phase we perform some static analysis on the query in order to reject invalid queries before sending them to the Spark cluster. Currently, we check that the variables used in the query are bound, but more analysis may come in the future. Example In this query we can see that the variable ?doc is not being used inside the WHERE clause, so we can say ?doc is not bound, thus it should return a Static Analysis error in this phase before evaluating the query in the Spark cluster. PREFIX doc: &lt;http://example.com/doc#&gt; PREFIX rdfs: &lt;http://www.w3.org/2000/01/rdf-schema#&gt; SELECT ?doc WHERE { doc:document1 rdfs:subClassOf ?parent . }"
    } ,    
    {
      "title": "Subclass Use Case",
      "url": "/docs/inference/subclass",
      "content": "Subclass Use Case In this use case we will see how we can infer some knowledge when we have a hierarchy of classes, where we have a superclass and one or multiple levels of subclasses defined in our ontology. Example Here we have an ontology with a class hierarchy with multiple levels defined. And then we have the knowledge graph with the data. We will apply some RDFS entailments (Rdfs9 and Rdfs11) and see what results we get from the inference. Rdfs9: IF THEN +---------------------------+--------------------+ |uuu rdfs:subClassOf xxx . | vvv rdf:type xxx . | |vvv rdf:type uuu . | | +---------------------------+--------------------+ Rdfs11 (transitive): IF THEN +---------------------------+---------------------------+ |uuu rdfs:subClassOf vvv . | uuu rdfs:subClassOf xxx . | |vvv rdfs:subClassOf xxx . | | +---------------------------+---------------------------+ For the sake of simplicity in the example, let’s assume we use Forward Chaining, so new triples will be materialized. So first if we apply Rdfs11 to the ontology, once for each level of the subclass hierarchy, we will materialize triples from all the child subclasses (if not already defined) to the superclass. Then, we can apply Rdfs9 to materialize all instances of the subclasses as instances of the superclass in the knowledge graph. So if we now run this query: PREFIX rdf: &lt;http://www.w3.org/1999/02/22-rdf-syntax-ns#&gt; PREFIX : &lt;http://example.org/class/&gt; SELECT ?person WHERE { ?person rdf:type class:Person } The result will contain Alice, Bob and Charles as if they were of class:Person, thanks to the inference."
    } ,    
    {
      "title": "Subproperty Use Case",
      "url": "/docs/inference/subproperty",
      "content": "Subproperty Use Case This use case is very similar to the Subclass Use Case but instead of classes with properties, we have a hierarchy of subproperties. Example We define an ontology with a subproperty hierarchy with multiple levels defined. And then we have the knowledge graph with the data. We will to apply some RDFS entailments (Rdfs5 and Rdfs7) and see what results we get from the inference. Rdfs5 (transitive): IF THEN +------------------------------+------------------------------+ |uuu rdfs:subPropertyOf vvv . | uuu rdfs:subPropertyOf xxx . | |vvv rdfs:subPropertyOf xxx . | | +------------------------------+------------------------------+ Rdfs7: IF THEN +------------------------------+--------------------+ |aaa rdfs:subPropertyOf bbb . | uuu bbb yyy . | |uuu aaa yyy . | | +------------------------------+--------------------+ For the sake of simplicity in the example, let’s assume we use Forward Chaining, so new triples will be materialized. So first if we apply Rdfs5 to the ontology, once for each level of the subproperty hierarchy, we will materialize triples from all the child subproperties (if not already defined)to the parent property. Then, we can apply Rdfs7 to materialize all instances of the subproperties as instances of the parent property in the knowledge graph. So if we now run this query: PREFIX prop: &lt;http://example.org/prop/&gt; SELECT ?person ?char WHERE { ?person prop:hasCharacteristic ?char } The result will contain Alice and Bob with their corresponding subproperties as if they were properties of the prop:hasCharacteristic, thanks to the inference."
    } ,    
    {
      "title": "Subquery Pushdown",
      "url": "/docs/phases/optimization/subqueryPushdown",
      "content": "Subquery Pushdown SPARQL supports nesting queries, this is called subqueries. Example PREFIX foaf: &lt;http://xmlns.com/foaf/0.1/&gt; PREFIX ex: &lt;http://example.org/&gt; CONSTRUCT { ?y foaf:knows ?name . } FROM NAMED &lt;http://example.org/alice&gt; WHERE { ?y foaf:knows ?x . GRAPH ex:alice { { SELECT ?x ?name WHERE { ?x foaf:name ?name . } } } } In this example, in order to support subqueries when the inner query is evaluated, the SELECT statement that is mapped as a Project in the DAG will drop all columns that are not within the variable bindings ?x and ?name. This means that the hidden column for the graph is dropped causing this info to be lost and consequently, when evaluating the outer query, it will fail as it expects this column to exist in the subquery result. So the strategy is to add the graph column variable to the list of variables that the inner Project will have, this way the graph column is not dropped anymore. Consider that the addition of this graph variable can only be done to the inner queries, while the variable list of the outer query must remain as is, otherwise the result would contain the graph column and that is not what the user expects from the query. This applies to all nodes that contain Ask, Project or Construct."
    } ,    
    {
      "title": "Techniques",
      "url": "/docs/techniques",
      "content": "Techniques In this section we show some techniques used by the Bellman engine: Recursion schemes Folding over a carrier function Inference - Forward Chaining Inference - Backward Chaining"
    } ,    
    {
      "title": "Graph Transformation",
      "url": "/docs/phases/transformToGraph",
      "content": "Graph Transformation The AST datatype that the parser module returns, Expr is not very well suited to running into Spark DataFrames, and it is also coupled to the bellman-parser module implementation. In order to decouple the internal datatype between bellman-algebra-parser and bellman-spark-engine modules and to simplify compilation into Spark DataFrames, we perform a transformation of the values from Expr AST into the datatype DAG. The internal DAG has several advantages: It contains queries as cases of the ADT. Avoids duplication of some SPARQL Algebrae."
    } ,    
    {
      "title": "Validate DataFrame",
      "url": "/docs/phases/validateDataframe",
      "content": "Validate DataFrame The Bellman engine interface Compiler.compile accepts two Spark DataFrames as input parameters: kg that contains the RDF graph. ontology that contains the ontology. This two DataFrames are constrained to be of the shape SPO or SPOG where this letters stands as for Subject (S), Predicate (P), Object (O), Graph (G). Validate DataFrame phase will validate that the input DataFrames meets this constraints, checking that they have three or four columns. Examples SPO DataFrame: val df = List( ( \"&lt;http://example.org/alice&gt;\", \"&lt;http://xmlns.com/foaf/0.1/name&gt;\", \"\\\"Alice\\\"\" ), ( \"&lt;http://example.org/alice&gt;\", \"&lt;http://xmlns.com/foaf/0.1/age&gt;\", \"21\" ), ( \"&lt;http://example.org/bob&gt;\", \"&lt;http://xmlns.com/foaf/0.1/name&gt;\", \"\\\"Bob\\\"\" ), ( \"&lt;http://example.org/bob&gt;\", \"&lt;http://xmlns.com/foaf/0.1/age&gt;\", \"15\" ) ).toDF(\"s\", \"p\", \"o\") Show: +--------------------------+--------------------------------+-------+ |s |p |o | +--------------------------+--------------------------------+-------+ |&lt;http://example.org/alice&gt;|&lt;http://xmlns.com/foaf/0.1/name&gt;|\"Alice\"| |&lt;http://example.org/alice&gt;|&lt;http://xmlns.com/foaf/0.1/age&gt; |21 | |&lt;http://example.org/bob&gt; |&lt;http://xmlns.com/foaf/0.1/name&gt;|\"Bob\" | |&lt;http://example.org/bob&gt; |&lt;http://xmlns.com/foaf/0.1/age&gt; |15 | +--------------------------+--------------------------------+-------+ SPOG DataFrame: val df = List( ( \"&lt;http://example.org/bob&gt;\", \"&lt;http://xmlns.com/foaf/0.1/&gt;\", \"\\\"Bob\\\"\", \"&lt;http://dm.org/graph1&gt;\" ), ( \"&lt;http://example.org/alice&gt;\", \"&lt;http://xmlns.com/foaf/0.1/&gt;\", \"\\\"Alice\\\"\", \"&lt;http://dm.org/graph2&gt;\" ), ( \"&lt;http://example.org/martha&gt;\", \"&lt;http://xmlns.com/foaf/0.1/&gt;\", \"\\\"Martha\\\"\", \"&lt;http://dm.org/graph3&gt;\" ) ).toDF(\"s\", \"p\", \"o\", \"g\") Show: +---------------------------+----------------------------+--------+----------------------+ |s |p |o |g | +---------------------------+----------------------------+--------+----------------------+ |&lt;http://example.org/bob&gt; |&lt;http://xmlns.com/foaf/0.1/&gt;|\"Bob\" |&lt;http://dm.org/graph1&gt;| |&lt;http://example.org/alice&gt; |&lt;http://xmlns.com/foaf/0.1/&gt;|\"Alice\" |&lt;http://dm.org/graph2&gt;| |&lt;http://example.org/martha&gt;|&lt;http://xmlns.com/foaf/0.1/&gt;|\"Martha\"|&lt;http://dm.org/graph3&gt;| +---------------------------+----------------------------+--------+----------------------+"
    }    
  ];

  idx = lunr(function () {
    this.ref("title");
    this.field("content");

    docs.forEach(function (doc) {
      this.add(doc);
    }, this);
  });

  docs.forEach(function (doc) {
    docMap.set(doc.title, doc.url);
  });
}

// The onkeypress handler for search functionality
function searchOnKeyDown(e) {
  const keyCode = e.keyCode;
  const parent = e.target.parentElement;
  const isSearchBar = e.target.id === "search-bar";
  const isSearchResult = parent ? parent.id.startsWith("result-") : false;
  const isSearchBarOrResult = isSearchBar || isSearchResult;

  if (keyCode === 40 && isSearchBarOrResult) {
    // On 'down', try to navigate down the search results
    e.preventDefault();
    e.stopPropagation();
    selectDown(e);
  } else if (keyCode === 38 && isSearchBarOrResult) {
    // On 'up', try to navigate up the search results
    e.preventDefault();
    e.stopPropagation();
    selectUp(e);
  } else if (keyCode === 27 && isSearchBarOrResult) {
    // On 'ESC', close the search dropdown
    e.preventDefault();
    e.stopPropagation();
    closeDropdownSearch(e);
  }
}

// Search is only done on key-up so that the search terms are properly propagated
function searchOnKeyUp(e) {
  // Filter out up, down, esc keys
  const keyCode = e.keyCode;
  const cannotBe = [40, 38, 27];
  const isSearchBar = e.target.id === "search-bar";
  const keyIsNotWrong = !cannotBe.includes(keyCode);
  if (isSearchBar && keyIsNotWrong) {
    // Try to run a search
    runSearch(e);
  }
}

// Move the cursor up the search list
function selectUp(e) {
  if (e.target.parentElement.id.startsWith("result-")) {
    const index = parseInt(e.target.parentElement.id.substring(7));
    if (!isNaN(index) && (index > 0)) {
      const nextIndexStr = "result-" + (index - 1);
      const querySel = "li[id$='" + nextIndexStr + "'";
      const nextResult = document.querySelector(querySel);
      if (nextResult) {
        nextResult.firstChild.focus();
      }
    }
  }
}

// Move the cursor down the search list
function selectDown(e) {
  if (e.target.id === "search-bar") {
    const firstResult = document.querySelector("li[id$='result-0']");
    if (firstResult) {
      firstResult.firstChild.focus();
    }
  } else if (e.target.parentElement.id.startsWith("result-")) {
    const index = parseInt(e.target.parentElement.id.substring(7));
    if (!isNaN(index)) {
      const nextIndexStr = "result-" + (index + 1);
      const querySel = "li[id$='" + nextIndexStr + "'";
      const nextResult = document.querySelector(querySel);
      if (nextResult) {
        nextResult.firstChild.focus();
      }
    }
  }
}

// Search for whatever the user has typed so far
function runSearch(e) {
  if (e.target.value === "") {
    // On empty string, remove all search results
    // Otherwise this may show all results as everything is a "match"
    applySearchResults([]);
  } else {
    const tokens = e.target.value.split(" ");
    const moddedTokens = tokens.map(function (token) {
      // "*" + token + "*"
      return token;
    })
    const searchTerm = moddedTokens.join(" ");
    const searchResults = idx.search(searchTerm);
    const mapResults = searchResults.map(function (result) {
      const resultUrl = docMap.get(result.ref);
      return { name: result.ref, url: resultUrl };
    })

    applySearchResults(mapResults);
  }

}

// After a search, modify the search dropdown to contain the search results
function applySearchResults(results) {
  const dropdown = document.querySelector("div[id$='search-dropdown'] > .dropdown-content.show");
  if (dropdown) {
    //Remove each child
    while (dropdown.firstChild) {
      dropdown.removeChild(dropdown.firstChild);
    }

    //Add each result as an element in the list
    results.forEach(function (result, i) {
      const elem = document.createElement("li");
      elem.setAttribute("class", "dropdown-item");
      elem.setAttribute("id", "result-" + i);

      const elemLink = document.createElement("a");
      elemLink.setAttribute("title", result.name);
      elemLink.setAttribute("href", result.url);
      elemLink.setAttribute("class", "dropdown-item-link");

      const elemLinkText = document.createElement("span");
      elemLinkText.setAttribute("class", "dropdown-item-link-text");
      elemLinkText.innerHTML = result.name;

      elemLink.appendChild(elemLinkText);
      elem.appendChild(elemLink);
      dropdown.appendChild(elem);
    });
  }
}

// Close the dropdown if the user clicks (only) outside of it
function closeDropdownSearch(e) {
  // Check if where we're clicking is the search dropdown
  if (e.target.id !== "search-bar") {
    const dropdown = document.querySelector("div[id$='search-dropdown'] > .dropdown-content.show");
    if (dropdown) {
      dropdown.classList.remove("show");
      document.documentElement.removeEventListener("click", closeDropdownSearch);
    }
  }
}
