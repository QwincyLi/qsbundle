'use strict';

module.exports = {
  load() {
  },

  unload() {
  },

  messages: {
    open() {
      Editor.Panel.open('qsbundle');
    },

    'query-info'(event) {
      var results = [];
      for (var p in Editor.assetdb._path2uuid) {
        var url = Editor.assetdb._url(p);
        var fspath = Editor.assetdb.urlToFspath(url)
        let rootUrl = "db://assets/"
        if (url.indexOf(rootUrl) >= 0 && url != rootUrl) {
          results.push({ url: url, uuid: Editor.assetdb._path2uuid[p], path: fspath });
        }
      }
      results.sort(function (a, b) {
        return a.url.localeCompare(b.url);
      });
      event.reply(null, results);
    },
  },
};
