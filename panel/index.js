const fs = require('fs');

function createVue(elem) {
    return new window.Vue({
        el: elem,
        data: {
            autoConfig: Editor.T('qsbundle.auto'),
            dicName: Editor.T('qsbundle.dictionary'),
            stateName: Editor.T('qsbundle.state'),
            configName: Editor.T('qsbundle.config'),
            priorityName: Editor.T('qsbundle.priority'),
            otherName: Editor.T('qsbundle.detail'),
            gotoName: Editor.T('qsbundle.goto'),
            infoList: [],
            searchValue: '',
        },
        methods: {
            showList() {
                Editor.Ipc.sendToMain('qsbundle:query-info', (err, results) => {
                    if (err) {
                        Editor.error(err);
                        return;
                    }
                    let fs = require('fire-fs');
                    let tmpList = [];
                    for (let i = 0; i < results.length; ++i) {
                        let info = results[i];
                        info.url = info.url.replace("db://assets/", "")
                        if (fs.isDirSync(info.path)) {
                            let metaFile = info.path + ".meta"
                            let data = fs.readFileSync(metaFile, 'utf-8');
                            data = JSON.parse(data);

                            //过滤掉父类已经配置为子包的
                            let parentIsBundle = false
                            for (let j = 0; j < tmpList.length; j++) {
                                let config = tmpList[j]
                                if (info.url.indexOf(config.key) >= 0 && config.value.isBundle) {
                                    parentIsBundle = true

                                    //如果子类已经设置为资源包则自动取消
                                    if (data.isBundle) {
                                        data.isBundle = false
                                        this._modify(data)
                                    }
                                    break
                                }
                            }
                            if (!parentIsBundle)
                                tmpList.push({ key: info.url, value: data });
                        }
                    }
                    this.infoList = tmpList;
                });
            },

            _onRefreshClick(event) {
                event.stopPropagation()
                this.showList()
            },

            _onAutoClick(event) {
                event.stopPropagation()
            },

            _switchOption(event, bundle) {
                bundle.isBundle = !bundle.isBundle
                this._modify(bundle)
                this.showList()
            },

            _switchPriority(event, bundle) {

                let priority = event.target.value
                bundle.priority = priority
                this._modify(bundle)
            },

            _selectBundle(event, bundle) {
                Editor.Selection.select("asset", bundle.uuid)
            },

            _setName(event, bundle) {
                let name = event.target.value
                bundle.bundleName = name
                this._modify(bundle)
            },

            _modify(bundle) {
                let uuid = bundle.uuid
                let fspath = Editor.remote.assetdb.uuidToFspath(uuid)
                let metaFile = fspath + '.meta'
                fs.writeFileSync(metaFile, JSON.stringify(bundle))
                Editor.assetdb.refresh(Editor.assetdb.remote.uuidToUrl(uuid))
            },

            filter(infoList, searchValue) {
                let text = searchValue.toLowerCase();
                let filterList = [];
                for (let i = 0; i < this.infoList.length; ++i) {
                    let info = this.infoList[i];
                    if (info.key.toLowerCase().indexOf(text) !== -1) {
                        filterList.push(info);
                        continue;
                    }

                    if (info.value.bundleName.toLowerCase().indexOf(text) !== -1) {
                        filterList.push(info);
                        continue;
                    }
                }
                return filterList;
            },
        },

        compiled() {
            this.showList();
        },
    });
}

Editor.Panel.extend({
    template: fs.readFileSync(Editor.url('packages://qsbundle/panel/template.html'), 'utf8'),

    style: fs.readFileSync(Editor.url('packages://qsbundle/panel/style.css'), 'utf8'),

    ready() {
        this._vm = createVue(this.shadowRoot);
    },
});