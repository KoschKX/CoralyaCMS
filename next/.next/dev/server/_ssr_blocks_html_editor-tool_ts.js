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

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ HtmlTool)\n/* harmony export */ });\n/**\r\n * EditorJS tool for raw HTML blocks.\r\n * Display-only preview in the canvas — editing happens in the right panel textarea.\r\n */ class HtmlTool {\n    static get toolbox() {\n        return {\n            title: \"HTML\",\n            icon: \"</>\"\n        };\n    }\n    static get isReadOnlySupported() {\n        return true;\n    }\n    constructor({ data }){\n        this.data = {\n            content: data?.content ?? \"\"\n        };\n    }\n    render() {\n        const el = document.createElement(\"div\");\n        el.className = \"cdx-block html-tool-preview\";\n        el.innerHTML = this.data.content;\n        return el;\n    }\n    save() {\n        return {\n            content: this.data.content\n        };\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ibG9ja3MvaHRtbC9lZGl0b3ItdG9vbC50cyIsIm1hcHBpbmdzIjoiOzs7O0FBQUE7OztDQUdDLEdBQ2MsTUFBTUE7SUFHbkIsV0FBV0MsVUFBVTtRQUNuQixPQUFPO1lBQUVDLE9BQU87WUFBUUMsTUFBTTtRQUFNO0lBQ3RDO0lBRUEsV0FBV0Msc0JBQXNCO1FBQUUsT0FBTztJQUFNO0lBRWhELFlBQVksRUFBRUMsSUFBSSxFQUFrQyxDQUFFO1FBQ3BELElBQUksQ0FBQ0EsSUFBSSxHQUFHO1lBQUVDLFNBQVNELE1BQU1DLFdBQVc7UUFBRztJQUM3QztJQUVBQyxTQUFTO1FBQ1AsTUFBTUMsS0FBS0MsU0FBU0MsYUFBYSxDQUFDO1FBQ2xDRixHQUFHRyxTQUFTLEdBQUc7UUFDZkgsR0FBR0ksU0FBUyxHQUFHLElBQUksQ0FBQ1AsSUFBSSxDQUFDQyxPQUFPO1FBQ2hDLE9BQU9FO0lBQ1Q7SUFFQUssT0FBTztRQUNMLE9BQU87WUFBRVAsU0FBUyxJQUFJLENBQUNELElBQUksQ0FBQ0MsT0FBTztRQUFDO0lBQ3RDO0FBQ0YiLCJzb3VyY2VzIjpbIlc6XFxQcm9ncmFtbWluZ1xcLSBHSVQgLVxcQ29yYWx5YUNNU1xcbmV4dFxcYmxvY2tzXFxodG1sXFxlZGl0b3ItdG9vbC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogRWRpdG9ySlMgdG9vbCBmb3IgcmF3IEhUTUwgYmxvY2tzLlxyXG4gKiBEaXNwbGF5LW9ubHkgcHJldmlldyBpbiB0aGUgY2FudmFzIOKAlCBlZGl0aW5nIGhhcHBlbnMgaW4gdGhlIHJpZ2h0IHBhbmVsIHRleHRhcmVhLlxyXG4gKi9cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSHRtbFRvb2wge1xyXG4gIHByaXZhdGUgZGF0YTogeyBjb250ZW50OiBzdHJpbmcgfTtcclxuXHJcbiAgc3RhdGljIGdldCB0b29sYm94KCkge1xyXG4gICAgcmV0dXJuIHsgdGl0bGU6IFwiSFRNTFwiLCBpY29uOiBcIjwvPlwiIH07XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgZ2V0IGlzUmVhZE9ubHlTdXBwb3J0ZWQoKSB7IHJldHVybiB0cnVlOyB9XHJcblxyXG4gIGNvbnN0cnVjdG9yKHsgZGF0YSB9OiB7IGRhdGE6IHsgY29udGVudD86IHN0cmluZyB9IH0pIHtcclxuICAgIHRoaXMuZGF0YSA9IHsgY29udGVudDogZGF0YT8uY29udGVudCA/PyBcIlwiIH07XHJcbiAgfVxyXG5cclxuICByZW5kZXIoKSB7XHJcbiAgICBjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICBlbC5jbGFzc05hbWUgPSBcImNkeC1ibG9jayBodG1sLXRvb2wtcHJldmlld1wiO1xyXG4gICAgZWwuaW5uZXJIVE1MID0gdGhpcy5kYXRhLmNvbnRlbnQ7XHJcbiAgICByZXR1cm4gZWw7XHJcbiAgfVxyXG5cclxuICBzYXZlKCkge1xyXG4gICAgcmV0dXJuIHsgY29udGVudDogdGhpcy5kYXRhLmNvbnRlbnQgfTtcclxuICB9XHJcbn1cclxuXHJcbiJdLCJuYW1lcyI6WyJIdG1sVG9vbCIsInRvb2xib3giLCJ0aXRsZSIsImljb24iLCJpc1JlYWRPbmx5U3VwcG9ydGVkIiwiZGF0YSIsImNvbnRlbnQiLCJyZW5kZXIiLCJlbCIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImNsYXNzTmFtZSIsImlubmVySFRNTCIsInNhdmUiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/./blocks/html/editor-tool.ts\n");

/***/ })

};
;