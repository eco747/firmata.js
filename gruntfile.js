var cp = require("child_process");
var tags = require("common-tags");

module.exports = function (grunt) {
  grunt.initConfig({
    mochaTest: {
      files: [
        "test/common/bootstrap.js",
        "test/unit/*.js"
      ],
    },
    jshint: {
      all: [ "gruntfile.js", "lib/*.js", "test/*.js", "examples/*.js"],
      options: {
        globals: {
          it: true,
          describe: true,
          beforeEach: true,
          afterEach: true,
          before: true
        },
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: false,
        nonew: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        node: true,
        strict: false,
        esnext: true,
      }
    },
    jscs: {
      files: {
        src: [ "gruntfile.js", "lib/*.js", "test/*.js", "examples/*.js"]
      },
      options: {
        config: ".jscsrc",
        requireCurlyBraces: [
          "if",
          "else",
          "for",
          "while",
          "do",
          "try",
          "catch",
        ],
        requireSpaceBeforeBlockStatements: true,
        requireParenthesesAroundIIFE: true,
        requireSpacesInConditionalExpression: true,
        // requireSpaceBeforeKeywords: true,
        requireSpaceAfterKeywords: [
          "if", "else",
          "switch", "case",
          "try", "catch",
          "do", "while", "for",
          "return", "typeof", "void",
        ],
        validateQuoteMarks: {
          mark: "\"",
          escape: true
        }
      }
    },
    jsbeautifier: {
      files: [ "gruntfile.js", "lib/*.js", "test/*.js", "examples/*.js"],
      options: {
        js: {
          braceStyle: "collapse",
          breakChainedMethods: false,
          e4x: false,
          evalCode: false,
          indentChar: " ",
          indentLevel: 0,
          indentSize: 2,
          indentWithTabs: false,
          jslintHappy: false,
          keepArrayIndentation: false,
          keepFunctionIndentation: false,
          maxPreserveNewlines: 10,
          preserveNewlines: true,
          spaceBeforeConditional: true,
          spaceInParen: false,
          unescapeStrings: false,
          wrapLineLength: 0
        }
      }
    },
  });

  grunt.registerTask("test", ["mochaTest"]);
  grunt.registerTask("default", ["jshint:all", "jscs", "mochaTest"]);
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-mocha-test");
  grunt.loadNpmTasks("grunt-jsbeautifier");
  grunt.loadNpmTasks("grunt-jscs");


  grunt.registerTask("test:file", "Run a single test specified by a target; usage: grunt test:file:<module-name>[.js]", function(file) {
    if (file) {
      grunt.config("mochaTest.files", [
        "test/common/bootstrap.js",
        "test/unit/" + file + ".js"
      ]);
    }

    grunt.task.run("mochaTest");
  });

  grunt.registerTask("changelog", "'changelog', 'changelog:v0.0.0..v0.0.2' or 'changelog:v0.0.0'", (arg) => {
    var done = grunt.task.current.async();
    var tags = cp.execSync("git tag --sort version:refname").toString().split("\n");
    var tagIndex = -1;
    var range;
    var revisionRange;

    if (!arg) {
      // grunt changelog
      range = tags.filter(Boolean).slice(-2);
    } else {
      if (arg.includes("..")) {
        // grunt changelog:<revision-range>
        if (!arg.startsWith("v") || !arg.includes("..v")) {
          range = arg.split("..").map(tag => tag.startsWith("v") ? tag : `v${tag}`);
        } else {
          // arg is a well formed <revision-range>
          revisionRange = arg;
        }
      } else {
        // grunt changelog:<revision>
        if (!arg.startsWith("v")) {
          arg = `v${arg}`;
        }

        tagIndex = tags.indexOf(arg);
        range = [tags[tagIndex - 1], tags[tagIndex]];
      }
    }

    if (!range && revisionRange) {
      range = revisionRange.split("..");
    }

    if (!revisionRange && (range && range.length)) {
      revisionRange = `${range[0]}..${range[1]}`;
    }

    cp.exec(`git log --format='|%h|%s|' ${revisionRange}`, (error, result) => {
      if (error) {
        console.log(error.message);
        return;
      }

      var rows = result.split("\n").filter(commit => {
        return !commit.includes("|Merge ") && !commit.includes(range[0]);
      });

      // Extra whitespace above and below makes it easier to quickly copy/paste from terminal
      grunt.log.writeln(`\n\n${changelog(rows)}\n\n`);

      done();
    });
  });
};

function changelog(rows) {
  return tags.stripIndent `
| Commit | Message/Description |
| ------ | ------------------- |
${rows.join("\n")}
`;
}
