/* eslint no-console: 0 */
/* eslint-disable */
'use strict';

const message = (
    'Member name "{{ name }}" has to start with "Highcharts.", "global.",' +
    ' or "globals.", if it is not part of an existing scope.'
);

const regExp = /^(?:Highcharts|globals?)\./;
const typelessTag = /@(function|interface|module|name|namespace)\s+([\w\.]+)/;
const typedTag = /@(param|typedef)\s+\{([\w\.]+)\}\s+\[?([\w\.]+)/;

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "blabla",
            category: "Docs",
            url: "https://github.com/highcharts/highcharts/"
        },
        fixable: null,
        schema: []
    },
    create: function (context) {

        let currentCodeDepth = 0;
        let currentCodeName = '';
        let currentCodeNames = [];
        let currentComment;
        let currentName;
        // let currentCodePath = null;

        return {
            BlockComment: function (node) {
                const blockComment = node.value;
                if (!blockComment ||
                    !blockComment.startsWith('*\n')
                ) {
                    return;
                }
                currentComment = blockComment;
            },
            Identifier: function (node) {
                currentCodeNames[currentCodeDepth - 1] = node.name;
                currentCodeName = currentCodeNames.join('.');
            },
            MemberExpression: function (node) {
                if (!regExp.test(currentCodeName + '.')) {
                    context.report(
                        node,
                        message,
                        {
                            name: currentCodeName
                        }
                    );
                }
            },
            onCodePathStart: function () {
                currentCodeDepth++;
                // currentCodePath = codePath;
            },
            onCodePathEnd: function () {
                currentCodeDepth--;
                // currentCodePath = codePath.upper;
            }
        };
    }
};
