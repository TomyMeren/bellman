val scala3Version = "2.11.12"

lazy val root = project
  .in(file("."))
  .settings(
    name := "microsite-test",
    version := "0.1.0-SNAPSHOT",

    scalaVersion := scala3Version,
  )
  .settings(
    micrositeName := "Bellman",
    micrositeDescription := "Efficiently running SPARQL queries in Spark",
    micrositeGithubOwner := "TomyMeren",
    micrositeGithubRepo := "bellman",
    micrositeGitHostingUrl := "https://github.com/TomyMeren/bellman",
    micrositeBaseUrl := "/bellman",
    micrositePushSiteWith := GitHub4s,
    mdocIn := (Compile / sourceDirectory).value / "docs",
    micrositeGithubToken := Option(System.getenv().get("GITHUB_TOKEN")),

  )
  .enablePlugins(MicrositesPlugin)