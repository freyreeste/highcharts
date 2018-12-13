/* eslint no-console: 0 */
/* eslint-disable */

'use strict';

const jsdoc = require('../jsdoc');

const message = (
    'Member name "{{ name }}" has to start with "Highcharts.", "global.",' +
    ' or "globals.", if it is not part of an existing scope.'
);

const scopePrefixRegExp = /^(?:Highcharts|globals?)\./;
const typelessTagRegExp = /@(function|interface|module|name|namespace)\s+([\w\.]+)/;
const typedTagRegExp = /@(param|typedef)\s+\{([^\}]+)\}\s+\[?([\w\.]+)/;

function extractName(comment) {
    const typelessTag = new RegExp(typelessTagRegExp, 'gm');
    const typedTag = new RegExp(typedTagRegExp, 'gm');
    console.log(typelessTag.exec(comment));
    console.log(typedTag.exec(comment));
    console.log(jsdoc);
}

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
        const visitor = new jsdoc.Visitor(context); //, node => process.stdout.write('\n\n' + node.doclet));
        return visitor.plan();
    }
};
