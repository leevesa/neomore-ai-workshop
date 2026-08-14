module.exports = function(karmaConfig) {
  let configuration = {
    frameworks: ["ui5", "qunit"],
    ui5: {
      url: "https://openui5.hana.ondemand.com",
      mode: "script",
      config: {
        async: true,
        bindingSyntax: "complex",
        compatVersion: "edge",
        resourceRoots: {
          "fi.neomore.template": "./base/webapp"
        }
      },
      tests: [
        "fi/neomore/template/test/unit/AllTests"
      ]
    },
    browsers: ["ChromeHeadless"],
    reporters: ["verbose"],
  };


  if (karmaConfig.spec?.length > 1 && typeof karmaConfig.spec == "string") {
    if (karmaConfig.spec.startsWith("unitTest/")) {
      karmaConfig.spec = `fi/neomore/template/test/unit${karmaConfig.spec.split("unitTest")[1]}`;
    }
    console.log(karmaConfig.spec)
    configuration.ui5.tests = [karmaConfig.spec]
  }

  if (karmaConfig.coverage) {
    configuration = {
      ...configuration,
      singleRun: true,
      // coverage reporter generates the coverage
      reporters: ['progress', 'coverage'],
      preprocessors: {
      // source files, that you wanna generate coverage for
      // do not include tests or libraries
      // (these files will be instrumented by Istanbul)
      'webapp/!(test)/**/*.js': ['coverage']
      },
      coverageReporter: {
        type : 'text'
      },
    };
  }
  karmaConfig.set(configuration);
}
