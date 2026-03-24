"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "_ssr_blocks_html_editor-tool_ts";
exports.ids = ["_ssr_blocks_html_editor-tool_ts"];
exports.modules = {

/***/ "(ssr)/./blocks/html/editor-tool.ts":
/*!************************************!*\
  !*** ./blocks/html/editor-tool.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ HtmlTool)\n/* harmony export */ });\n/**\n * EditorJS tool for raw HTML blocks.\n * Display-only preview in the canvas — editing happens in the right panel textarea.\n */ class HtmlTool {\n    static get toolbox() {\n        return {\n            title: \"HTML\",\n            icon: \"</>\"\n        };\n    }\n    static get isReadOnlySupported() {\n        return true;\n    }\n    constructor({ data }){\n        this.data = {\n            content: data?.content ?? \"\"\n        };\n    }\n    render() {\n        const el = document.createElement(\"div\");\n        el.className = \"cdx-block html-tool-preview\";\n        el.innerHTML = this.data.content;\n        return el;\n    }\n    save() {\n        return {\n            content: this.data.content\n        };\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ibG9ja3MvaHRtbC9lZGl0b3ItdG9vbC50cyIsIm1hcHBpbmdzIjoiOzs7O0FBQUE7OztDQUdDLEdBQ2MsTUFBTUE7SUFHbkIsV0FBV0MsVUFBVTtRQUNuQixPQUFPO1lBQUVDLE9BQU87WUFBUUMsTUFBTTtRQUFNO0lBQ3RDO0lBRUEsV0FBV0Msc0JBQXNCO1FBQUUsT0FBTztJQUFNO0lBRWhELFlBQVksRUFBRUMsSUFBSSxFQUFrQyxDQUFFO1FBQ3BELElBQUksQ0FBQ0EsSUFBSSxHQUFHO1lBQUVDLFNBQVNELE1BQU1DLFdBQVc7UUFBRztJQUM3QztJQUVBQyxTQUFTO1FBQ1AsTUFBTUMsS0FBS0MsU0FBU0MsYUFBYSxDQUFDO1FBQ2xDRixHQUFHRyxTQUFTLEdBQUc7UUFDZkgsR0FBR0ksU0FBUyxHQUFHLElBQUksQ0FBQ1AsSUFBSSxDQUFDQyxPQUFPO1FBQ2hDLE9BQU9FO0lBQ1Q7SUFFQUssT0FBTztRQUNMLE9BQU87WUFBRVAsU0FBUyxJQUFJLENBQUNELElBQUksQ0FBQ0MsT0FBTztRQUFDO0lBQ3RDO0FBQ0YiLCJzb3VyY2VzIjpbIi9Wb2x1bWVzL1dvcmtzcGFjZS9Qcm9ncmFtbWluZy8tIEdJVCAtLy0gSU5BQ1RJVkUgLS9Db3JhbHlhQ01TL25leHQvYmxvY2tzL2h0bWwvZWRpdG9yLXRvb2wudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBFZGl0b3JKUyB0b29sIGZvciByYXcgSFRNTCBibG9ja3MuXG4gKiBEaXNwbGF5LW9ubHkgcHJldmlldyBpbiB0aGUgY2FudmFzIOKAlCBlZGl0aW5nIGhhcHBlbnMgaW4gdGhlIHJpZ2h0IHBhbmVsIHRleHRhcmVhLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIdG1sVG9vbCB7XG4gIHByaXZhdGUgZGF0YTogeyBjb250ZW50OiBzdHJpbmcgfTtcblxuICBzdGF0aWMgZ2V0IHRvb2xib3goKSB7XG4gICAgcmV0dXJuIHsgdGl0bGU6IFwiSFRNTFwiLCBpY29uOiBcIjwvPlwiIH07XG4gIH1cblxuICBzdGF0aWMgZ2V0IGlzUmVhZE9ubHlTdXBwb3J0ZWQoKSB7IHJldHVybiB0cnVlOyB9XG5cbiAgY29uc3RydWN0b3IoeyBkYXRhIH06IHsgZGF0YTogeyBjb250ZW50Pzogc3RyaW5nIH0gfSkge1xuICAgIHRoaXMuZGF0YSA9IHsgY29udGVudDogZGF0YT8uY29udGVudCA/PyBcIlwiIH07XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIGVsLmNsYXNzTmFtZSA9IFwiY2R4LWJsb2NrIGh0bWwtdG9vbC1wcmV2aWV3XCI7XG4gICAgZWwuaW5uZXJIVE1MID0gdGhpcy5kYXRhLmNvbnRlbnQ7XG4gICAgcmV0dXJuIGVsO1xuICB9XG5cbiAgc2F2ZSgpIHtcbiAgICByZXR1cm4geyBjb250ZW50OiB0aGlzLmRhdGEuY29udGVudCB9O1xuICB9XG59XG5cbiJdLCJuYW1lcyI6WyJIdG1sVG9vbCIsInRvb2xib3giLCJ0aXRsZSIsImljb24iLCJpc1JlYWRPbmx5U3VwcG9ydGVkIiwiZGF0YSIsImNvbnRlbnQiLCJyZW5kZXIiLCJlbCIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImNsYXNzTmFtZSIsImlubmVySFRNTCIsInNhdmUiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/./blocks/html/editor-tool.ts\n");

/***/ })

};
;