(defproject new-turing-omnibus "1.0.0-SNAPSHOT"
  :dependencies [[org.clojure/clojure "1.4.0"]]
  :plugins [[lein-cljsbuild "0.2.4"]
            [lein-swank "1.4.4"]]
  :cljsbuild {:builds [{:source-path "src"
                        :compiler {:output-to "main.js"
                                   :output-dir "out"}}]})