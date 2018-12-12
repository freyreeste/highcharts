/* *
 *
 *  Copyright (c) 2018 Highsoft AS
 *
 * */

/* eslint no-console: 0 */

/* *
 *
 *  Interfaces
 *
 * */

/**
 * A regular expression match on a text.
 *
 * @interface RegExpMatch
 * @extends {Array<string|undefined>}
 *//**
 * The first index position of the match on the input text.
 * @name RegExpMatch#index
 * @type {number}
 *//**
 * The last index position of the match on the input text.
 * @name RegExpMatch#indexEnd
 * @type {number}
 */

/**
 * Array with all regular expression matches on a text.
 *
 * @interface RegExpMatches
 * @extends {Array<RegExpMatch>}
 *//**
 * The original string that was matched against.
 * @name RegExpMatches#input
 * @type {string}
 */

/* *
 *
 *  Constants
 *
 * */

const REGEXP_DOCLET = /[\f\t\v ]*\/\*\*([\s\S]+?)\*\//gm;
const REGEXP_DOCLINE = /^([\f\t\v ]*)\*(.*)$/gm;
const REGEXP_DOCSPLIT = /[\n\r][\s\*]+(?=@)/gm;

/* *
 *
 *  Static Functions
 *
 * */

/**
 * Returns all regular expression matches on a text.
 *
 * @function matchAll
 *
 * @param {string} text
 *        The text to match on.
 *
 * @param {RegExp} regExp
 *        The regular expression to match agains.
 *
 * @return {RegExpMatches}
 *         All Matches in the text.
 */
function matchAll(text, regExp) {
    const matches = [];
    let match = null;
    while ((match = regExp.exec(text)) !== null) {
        delete match.input;
        match.indexEnd = regExp.lastIndex;
        matches.push(match);
    }
    matches.input = text;
    regExp.lastIndex = 0;
    return matches;
}

/**
 * Stringifies objects with circular members.
 *
 * @param {object} obj
 *        The object to stringify.
 *
 * @param {string} [indent]
 *        The optional indention of the stringification.
 *
 * @return {string}
 *         The stringification of the object.
 */
function stringify(obj, indent) {
    const circularCache = [];
    const json = JSON.stringify(obj, function (key, value) {
        if (typeof value === 'object' &&
            value !== null
        ) {
            if (circularCache.indexOf(value) === -1) {
                circularCache.push(value);
            } else {
                try {
                    return JSON.parse(JSON.stringify(value));
                } catch (e) {
                    return `[${e}]`;
                }
            }
        }
        return value;
    }, indent);
    circularCache.length = 0;
    return json;
}

/* *
 *
 *  Classes
 *
 * */

/**
 * A doclet.
 */
class Doclet {

    /* *
     *
     *  Constructors
     *
     * */

    /**
     * Creates a doclet instance.
     *
     * @param {string} comment
     *        The doclet comment, with or without the slashes.
     *
     * @param {string} code
     *        The code line following the doclet comment.
     *
     * @param {number} codeLine
     *        The number of the following code line.
     */
    constructor(comment, code, codeLine) {

        /* *
         *
         *  Properties
         *
         * */

        /**
         * The code line following the doclet comment.
         */
        this.code = code;

        /**
         * The number of the following code line.
         */
        this.codeLine = codeLine;


        /**
         * The doclet comment, with or without the slashes.
         */
        this.comment = comment;

        /**
         * The parsed doclet sections.
         */
        this.sections = comment
            .replace(REGEXP_DOCLET, '$1')
            .replace(REGEXP_DOCLINE, '$2')
            .split(REGEXP_DOCSPLIT);
    }

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Returns a string representation of the doclets.
     *
     * @return {string}
     *         The string representation of the doclets.
     */
    toString() {
        return this.sections.join('\n\n');
    }

}

/**
 * Handling ESLint parsing.
 */
class Visitor {

    /* *
     *
     *  Constructors
     *
     * */

    /**
     * Creates a new Visitor instance for ESLint handling.
     *
     * @param {object} context
     *        The ESLint context for the Visitor instance.
     *
     * @param {Function} visitCallback
     *        The callback during a JSDoc comment visit.
     */
    constructor(context, visitCallback) {

        if (!context) {
            throw new Error('Context is missing!');
        }

        /* *
         *
         *  Properties
         *
         * */

        this._codeLines = new Array(context.getSourceCode().lines);
        this._visitCallback = (visitCallback || function () {});

        /**
         * The ESLint context of the Visitor instance.
         */
        this.context = context;

        /**
         * Doclet root.
         * @name #rootDoclet
         */
    }


    /* *
     *
     *  Functions
     *
     * */

    _addChildNode(node) {

        if (!this._currentNode) {
            this._currentNode = {
                depth: 0
            };
            this.rootNode = this._currentNode;
        }

        const currentNode = this._currentNode;

        node.parent = currentNode;
        node.depth = (currentNode.depth + 1);

        currentNode.children = (currentNode.children || []);
        currentNode.children.push(node);

    }

    plan() {
        /* Possible types:
           ArrayExpression, ArrayPattern, ArrowFunctionExpression,
           AssignmentExpression, AssignmentPattern, AwaitExpression,
           BinaryExpression, BlockComment, BlockStatement, BreakStatement,
           CallExpression, CatchClause, ClassBody, ClassDeclaration,
           ClassExpression, ConditionalExpression, ContinueStatement,
           DebuggerStatement, DoWhileStatement, EmptyStatement,
           ExportAllDeclaration, ExportDefaultDeclaration,
           ExportNamedDeclaration, ExpressionStatement, ForInStatement,
           ForOfStatement, ForStatement, FunctionDeclaration,
           FunctionExpression, Identifier, IfStatement, ImportDeclaration,
           ImportNamespaceSpecifier, LabeledStatement, LineComment, Literal,
           LogicalExpression, MemberExpression, MethodDefinition, NewExpression,
           ObjectExpression, ObjectPattern, Program, Property, ReturnStatement,
           SequenceExpression, Super, SwitchCase, SwitchStatement,
           TaggedTemplateExpression, ThisExpression, ThrowStatement,
           TemplateElement, TemplateLiteral, TryStatement, UnaryExpression,
           UpdateExpression, VariableDeclaration, VariableDeclarator,
           WhileStatement, WithStatement, YieldExpression
         */
        /* Possible events:
           onCodePathEnd, onCodePathSegmentEnd, onCodePathSegmentLoop,
           onCodePathSegmentStart, onCodePathStart
         */
        return {
            BlockComment: this.visitComment.bind(this),
            Identifier: this.visitIdentifier.bind(this),
            onCodePathStart: this.visitStart.bind(this),
            onCodePathEnd: this.visitEnd.bind(this)
        };
    }

    visitComment(astNode) {

        const comment = astNode.value;

        if (comment[0] !== '*') {
            return;
        }

        const codeLine = astNode.loc.end.line + 1;
        const code = this._codeLines[codeLine - 1];

        const node = {
            doclet: new Doclet(comment, codeLine, code)
        };

        this._addChildNode(node);
        this._visitCallback(node, Visitor);

    }

    visitIdentifier(astNode) {

        const codeLine = astNode.loc.end.line;
        const currentNode = this._currentNode;
        const currentDoclet = currentNode && currentNode.doclet;

        if (currentDoclet &&
            currentDoclet.codeLine === codeLine &&
            !currentDoclet.codeName
        ) {
            currentDoclet.codeName = astNode.value;
        }

    }

    visitStart(astNode) {

        const codeLine = astNode.loc && astNode.loc.end.line;
        const currentNode = this._currentNode;
        const currentDoclet = currentNode && currentNode.doclet;

        if (!codeLine ||
            !currentDoclet ||
            codeLine !== currentDoclet.codeLine
        ) {
            return;
        }

        const node = {};

        this._addChildNode(node);
        this._currentNode = node;

    }

    visitEnd() {

        const currentNode = this._currentNode;

        if (currentNode &&
            currentNode.parent
        ) {
            this._currentNode = currentNode.parent;
        }

    }

}

/* *
 *
 *  Exports
 *
 * */

module.exports = {
    REGEXP_DOCLET,
    REGEXP_DOCLINE,
    REGEXP_DOCSPLIT,
    Doclet,
    Visitor,
    Utilities: {
        matchAll,
        stringify
    }
};
