/**
 * Name:        generation.js
 * Author:      lgc0208@foxmail.com
 * Version:     1.0.0
 * Description: 实现参考文献格式生成器功能函数
 * History:            
        1.  Date:           2022-6-22
            Author:         lgc0208@foxmail.com
            Modification:   实现对 GB/T 7714-2015 和 IEEE 格式的支持
 */
var _ = {
    doc: document,
    el: function (id) {
        return this.doc.getElementById(id);
    },
    createEl: function (name, obj) {
        var el = this.doc.createElement(name);
        _.each(obj, function (value, key) {
            switch (key) {
                case 'html':
                case 'text':
                    el.innerHTML = value;
                    break;
                case 'style':
                    _.each(value, function (value, key) {
                        el.style[key] = value;
                    });
                    break;
                default:
                    el.setAttribute(key, value);
            }
        });
        return el;
    },

    // 遍历函数
    each: function (arr, fn, max) {
        max = max || Number.MAX_VALUE;
        var i, item;

        if (_.isArray(arr, false)) {

            for (i = 0; item = arr[i]; i++) {
                if (i >= max || fn(item, i) === false) {
                    break;
                }
            }
        } else {
            for (i in arr) {
                max--;
                if (max < 0 || fn(arr[i], i) === false) {
                    break;
                }
            }
        }

    },

    isArray: function (value, strict) {
        var type = Object.prototype.toString.apply(value),
            isObj = value.length === undefined || _.isFunction(value);
        if (strict !== false) {
            return type === '[object Array]';
        } else {
            return !isObj;
        }
    },
    isFunction: function (value) {
        return typeof value === 'function' || typeof value === 'Function';
    },

    // 添加模板
    templateIn: function (template, obj) {
        var result = template;
        _.each(obj, function (item, i) {
            result = result.replace(new RegExp('{' + i + '}', 'g'), item);
        });
        return result;
    },
    mixIn: function (className, obj) {
        var args = arguments,
            proto = className.prototype,
            i, o;
        for (i = 1; o = args[i]; i++) {
            _.each(o, function (value, key) {
                proto[key] = value;
            });
        }
    },

    // 绑定事件函数
    bind: function (element, event, fn, scope) {
        var f = function () {
            fn.apply(scope || this, arguments);
        }
        if (element.addEventListener) {
            element.addEventListener(event, f, false);
        } else if (element.attachEvent) {
            element.attachEvent('on' + event, f);
        }
    },
    trim: function (str) {
        str = str.replace(/^\s+/, '');
        var end = str.length - 1,
            regx = /\s/;
        while (regx.test(str.charAt(end))) {
            end--;
        }
        return str.slice(0, end + 1);
    }
}

// 运行流程
var Generation = function () {
    this.initHooks();
    this.initTypes();
    this.showTypeOptions();
    this.showInputs(this.defaultType, this.defaultFormatType);
    this.bindEvents();
}

// 函数基础配置
Generation.config = {
    itemRegx: /{(\[.*?\])?(.+?)(\[.*?\])?}/g,
    defaultFormatType: 'GB/T 7714-2015',
    defaultType: 'J',
    types: {
        'GB/T 7714-2015': {
            J: {
                name: '期刊',
                required: '作者,题目,期刊名,出版年份,期数',
                format: '{作者}. {题目}[J]. {期刊名}, {出版年份}{[, ]卷号}{[(]期数[)]}{[:]起止页码}.'
            },
            N: {
                name: '报纸',
                required: '作者,题目,报纸名,出版日期,版次',
                format: '{作者}. {题目}[N]. {报纸名}, {出版日期}{[(]版次[)]}.'
            },
            M: {
                name: '图书',
                required: '作者,题目,版次,出版单位,出版年份',
                format: '{作者}. {题目}[M]. {其他责任人[, ]}{版次[. ]}{出版地[: ]}{出版单位}{[, ]出版年份}{[ :]起止页码}.'
            },
            C: {
                name: '会议录,论文集',
                required: '作者,题目,论文集名,出版单位,出版年份',
                format: '{作者}. {题目}[C]: {主编[.]}{论文集名}, {出版地[: ]}{出版单位[, ]}{出版年份}.'
            },
            D: {
                name: '学位论文',
                required: '作者,题目,保存单位,年份',
                format: '{作者}. {题目}[D]. {保存地点[: ]}{保存单位}{[, ]年份}.'
            },
            R: {
                name: '报告',
                required: '作者,题目,报告地,主办单位,报告年份',
                format: '{作者}. {题目}[R]. {报告地[: ]}{主办单位}{[, ]报告年份}.'
            },
            P: {
                name: '专利',
                required: '作者,专利名,专利号,公开日期',
                format: '{作者}. {专利名[: ]}{专利号}[P]. {公开日期}'
            },
            S: {
                name: '标准',
                required: '作者,标准名,标准号,出版地,出版单位,出版年',
                format: '{作者}. {标准名[: ]}{标准号}[S]. {出版地[: ]}{出版者}, {出版年}{[:]起止页码}'
            },
            'EB/OL': {
                name: '电子资源',
                required: '责任者,题目,引用日期,访问路径',
                format: '{责任者}. {题目}[EB/OL]. {出版日期}[{引用日期}]. {访问路径}.'
            }
        },
        'IEEE': {
            J: {
                name: '期刊',
                required: '作者,题目,期刊名,卷数,起止页码,年份',
                format: '{作者}, \"{题目}\", {期刊名}, vol.{卷数}, pp.{起止页码}, {月份[.]}{年份}.'
            },
            C: {
                name: '会议',
                required: '作者,题目,会议名称,地点,年份,起止页码',
                format: '{作者}, \"{题目},\" in {会议名称}, {地点}, {年份}, pp.{起止页码}'
            },
            M: {
                name: '图书',
                required: '作者,书名,出版地,出版社,年份',
                format: '{作者}, {书名}, {版本号[, ]}{卷数[. ]}{出版地}:{出版社}, {年份}{[, ]起止页码}'
            },
            'EB/OL': {
                name: '电子资源',
                required: '责任者,题目,地区,发布单位,年份,访问路径',
                format: '{责任者}. {题目}. {地区}:{发布单位}, {年份}. [Online]. Available: {访问路径}'
            }
        }
    },
    descriptions: {
        '作者': '多位作者请用英文逗号“,”分开',
        '其他责任人': '多位作者请用英文逗号“,”分开',
        '引用日期': '格式为 年-月-日，例如 2022-06-22',
        '起止页码': '格式为 xx-yy，例如 4-16'
    }
}

// 格式解析
Generation.fn = {
    // 初始化标准种类
    initTypes: function () {
        var that = this;
        _.each(this.types['GB/T 7714-2015'], function (type) {
            var format = type['format'],
                regx = that.itemRegx,
                regxArr = format.match(regx);
            type.required = type.required.split(',');
            type.regxArr = {};
            type.items = [];
            _.each(regxArr, function (item, i) {
                regx.lastIndex = 0;
                var result = regx.exec(item);
                if (result[1]) {
                    result[1] = result[1].substr(1, result[1].length - 2);
                }
                if (result[3]) {
                    result[3] = result[3].substr(1, result[3].length - 2);
                }
                type.regxArr[result[0]] = result;
                type.items[i] = result[2];
            });
        });
        _.each(this.types['IEEE'], function (type) {
            var format = type['format'],
                regx = that.itemRegx,
                regxArr = format.match(regx);
            type.required = type.required.split(',');
            type.regxArr = {};
            type.items = [];
            _.each(regxArr, function (item, i) {
                regx.lastIndex = 0;
                var result = regx.exec(item);
                if (result[1]) {
                    result[1] = result[1].substr(1, result[1].length - 2);
                }
                if (result[3]) {
                    result[3] = result[3].substr(1, result[3].length - 2);
                }
                type.regxArr[result[0]] = result;
                type.items[i] = result[2];
            });
        });
    },

    // 判断该项是否是必选项
    isRequired: function (itemName, typeName, formatName) {
        var type = this.types[formatName][typeName];
        if (!type) {
            return false;
        }
        var required = type.required,
            result = false,
            i, item;
        for (i = 0; item = required[i]; i++) {
            if (item == itemName) {
                result = true;
                break;
            }
        }
        return result;
    },

    // 获取格式类型下对应的文献类型
    getItems: function (typeName, formatName) {
        var type = this.types[formatName][typeName];
        console.log(type);
        return type && type.items;
    },

    // 解析格式
    formatGeneration: function (typeName, formatName, obj) {
        var that = this,
            type = this.types[formatName][typeName];
        if (!type) {
            return false;
        }
        var regx = this.itemRegx;
        var result = type.format.replace(regx, function (match) {
            var regxArr = type.regxArr[match],
                name = regxArr[2],
                result = '';
            if (obj[name]) {
                regxArr[1] && (result += regxArr[1]);
                if (name == '作者' || name == '其他责任人') {
                    obj[name] = that.formatAuthors(obj[name]);
                }
                result += obj[name];
                regxArr[3] && (result += regxArr[3]);
            }
            return result;
        });
        return result;
    },

    // 多作者情况下的格式更改
    formatAuthors: function (authors) {
        var authorArr = authors.split(/,|，/),
            isEn = false,
            enRegx = /^[a-zA-Z \.-]+$/,
            formated = /^[a-zA-Z]{2,}( [A-Z])*$/,
            temp, lastName, i, len, result = [];
        _.each(authorArr, function (author) {
            author = _.trim(author);
            if ((isEn = enRegx.test(author))) {
                author = author.replace(/\.|-/g, '');
                if (!formated.test(author)) {
                    temp = author.split(' ');
                    len = temp.length;
                    lastName = temp[--len];
                    author = lastName.charAt(0).toUpperCase() + lastName.substr(1);
                    for (i = 0; i < len; i++) {
                        if (temp[i]) {
                            author += ' ';
                            author += temp[i].charAt(0).toUpperCase();
                        }
                    }
                }
            }
            result.push(author);
        }, 3);
        if (authorArr.length > 3) {
            result.push(isEn ? 'et. al' : '等')
        }
        return result.join(', ')
    }
}

// 运行控制逻辑
Generation.ctrl = {
    formatSelector: '',
    typeSelector: '',
    inputForm: '',
    resultDiv: '',
    addBtn: '',
    selectType: '',
    initHooks: function () {
        this.formatSelector = _.el('formatSelector')
        this.typeSelector = _.el('typeSelector');
        this.inputForm = _.el('inputForm');
        this.resultDiv = _.el('resultDiv');
        this.addBtn = _.el('addBtn');
    },

    // 展示需要用户输入的数据项
    showInputs: function (typeName, formatName) {
        this.formatType = formatName;
        this.selectType = typeName;
        var template = '<p><label>{inputName}<span class="required">{required}</span></label><input type="text" name="{inputName}" value=""/>{desc}</p>';
        var that = this,
            // 获取该文献类型下可以包含的数据项
            items = this.getItems(typeName, formatName),
            // 存储用以展现的 HTML 代码格式
            html = '';
        // 对文献类型包含的数据项进行查看
        _.each(items, function (item, i) {
            var obj = {
                inputName: item,
                required: that.isRequired(item, typeName, formatName) ? '*' : '&nbsp;',
                desc: ''
            };
            if (that.descriptions[item]) {
                obj.desc = '<span class="desc">' + that.descriptions[item] + '</span>';
            }
            html += _.templateIn(template, obj);
        });
        this.inputForm.innerHTML = html;
    },

    // 展示可选择的文献类型
    showTypeOptions: function () {
        var that = this,
            types = this.types,
            formatSelector = this.formatSelector,
            typeSelector = this.typeSelector,
            html = '';
        // 格式类型
        _.each(types, function (item, i) {
            var option = _.createEl('option', {
                text: i,
                value: i
            });
            if (that.defaultFormatType == i) {
                option.selected = true;
                option.defaultselected = true;
            }
            formatSelector.appendChild(option);
        });

        // 文献类型
        _.each(types[formatSelector.value], function (item, i) {
            var option = _.createEl('option', {
                text: item.name,
                value: i
            });
            if (that.defaultType == i) {
                option.selected = true;
                option.defaultselected = true;
            }
            typeSelector.appendChild(option);
        });
    },

    // 清空表单
    cleanForm: function () {
        var formEls = this.inputForm.elements;
        _.each(formEls, function (el) {
            el.value = '';
        });
    },

    // 用户改变格式类型时对对应的文献类型进行更改
    showFormatChange: function () {
        var that = this,
            types = this.types,
            typeSelector = this.typeSelector,
            html = '';
        for (var i = typeSelector.length - 1; i >= 0; i--) {
            typeSelector.removeChild(typeSelector[i])
        }
        // 文献类型
        _.each(types[formatSelector.value], function (item, i) {
            var option = _.createEl('option', {
                text: item.name,
                value: i
            });
            if (that.defaultType == i) {
                option.selected = true;
                option.defaultselected = true;
            }
            typeSelector.appendChild(option);
        });
    },

    // 用户改变文献类型的响应函数
    onTypeChange: function () {
        var formatType = this.formatSelector.value;
        var typeName = this.typeSelector.value;
        this.showInputs(typeName, formatType);
    },

    // 用户改变格式类型的响应函数
    onFormatChange: function () {
        var formatType = this.formatSelector.value;
        var typeName = "J";
        this.showFormatChange();
        this.showInputs(typeName, formatType);
    },



    // 添加条目
    addContent: function () {
        var formEls = this.inputForm.elements,
            formatName = this.formatSelector.value,
            formContent = {},
            result, html;
        _.each(formEls, function (item) {
            if (item.name) {
                formContent[item.name] = item.value;
            }
        });
        result = this.formatGeneration(this.selectType, formatName, formContent);
        html = '<div class="resultItem"><div class="referanceContent">' + result + '</div><a href="javascript:" class="delete">Delete</a><a href="javascript:" class="edit">Edit</a></div>';
        this.resultDiv.innerHTML += html;
        this.cleanForm();
    },

    // 监听结果编辑时间
    listenResultDivEvents: function (e) {
        e = e || window.event;
        var target = e.target || e.srcElement,
            resultDiv = this.resultDiv,
            attr;

        switch (target.className) {
            // 用户选择删除
            case 'delete':
                resultDiv.removeChild(target.parentNode);
                break;
                // 用户选择编辑
            case 'edit':
                _.each(target.parentNode.childNodes, function (item) {
                    if (item.className == 'referanceContent') {
                        item.setAttribute('contentEditable', true);
                        item.focus();
                        item.onblur = function () {
                            item.removeAttribute('contentEditable');
                        }
                    }
                });
                break;
        }
    },

    // 绑定事件
    bindEvents: function () {
        _.bind(this.formatSelector, 'change', this.onFormatChange, this);
        _.bind(this.typeSelector, 'change', this.onTypeChange, this);
        _.bind(this.addBtn, 'click', this.addContent, this);
        _.bind(this.resultDiv, 'click', this.listenResultDivEvents, this);
    }
}
_.mixIn(Generation, Generation.config, Generation.fn, Generation.ctrl);

new Generation();