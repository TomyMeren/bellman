---
layout: docs
title: Intro
permalink: docs/intro
---

# Intro

**Bellman** is an engine written in **Scala** that evaluates [**SPARQL 1.1**](https://www.w3.org/TR/sparql11-query/) 
queries and executes them over [**RDF**](https://www.w3.org/RDF/) data stored in a [**Spark**](https://spark.apache.org/)
cluster.

It relies on [**Apache Jena**](https://jena.apache.org/) to parse the **SPARQL** queries, and on recursion-schemes library
[**Droste**](https://github.com/higherkindness/droste) to compile the **SPARQL algebra** into **Spark** instructions.

It can perform inference reasoning when provided with an ontology defined in the [**RDFS**](https://www.w3.org/TR/rdf-schema/)
and [**OWL**](https://www.w3.org/OWL/) semantic languages.
