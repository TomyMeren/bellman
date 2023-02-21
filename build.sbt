val scala2Version = "2.12.16"

lazy val root = project
  .in(file("."))
  .settings(
    name := "microsite-test",
    version := "0.1.0-SNAPSHOT",

    scalaVersion := scala2Version,
  )
  .settings(
    micrositeName := "Bellman",
    micrositeDescription := "Efficiently running SPARQL queries in Spark",
    micrositeGithubOwner := "gsk-tech",
    micrositeGithubRepo := "bellman",
    micrositeGitHostingService := GitHub,
    micrositeGitHostingUrl := "https://mygithub.gsk.com/gsk-tech/bellman",
    micrositeBaseUrl := "/bellman",
    micrositePushSiteWith := GitHub4s,
    mdocIn := (Compile / sourceDirectory).value / "docs",
    micrositeGithubToken := Option(System.getenv().get("GITHUB_TOKEN")),
  )
  .enablePlugins(MicrositesPlugin)