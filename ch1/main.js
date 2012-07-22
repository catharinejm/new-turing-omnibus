var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__6150 = x == null ? null : x;
  if(p[goog.typeOf(x__6150)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__6151__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6151 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6151__delegate.call(this, array, i, idxs)
    };
    G__6151.cljs$lang$maxFixedArity = 2;
    G__6151.cljs$lang$applyTo = function(arglist__6152) {
      var array = cljs.core.first(arglist__6152);
      var i = cljs.core.first(cljs.core.next(arglist__6152));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6152));
      return G__6151__delegate(array, i, idxs)
    };
    G__6151.cljs$lang$arity$variadic = G__6151__delegate;
    return G__6151
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____6237 = this$;
      if(and__3822__auto____6237) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____6237
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2387__auto____6238 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6239 = cljs.core._invoke[goog.typeOf(x__2387__auto____6238)];
        if(or__3824__auto____6239) {
          return or__3824__auto____6239
        }else {
          var or__3824__auto____6240 = cljs.core._invoke["_"];
          if(or__3824__auto____6240) {
            return or__3824__auto____6240
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____6241 = this$;
      if(and__3822__auto____6241) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____6241
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2387__auto____6242 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6243 = cljs.core._invoke[goog.typeOf(x__2387__auto____6242)];
        if(or__3824__auto____6243) {
          return or__3824__auto____6243
        }else {
          var or__3824__auto____6244 = cljs.core._invoke["_"];
          if(or__3824__auto____6244) {
            return or__3824__auto____6244
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____6245 = this$;
      if(and__3822__auto____6245) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____6245
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2387__auto____6246 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6247 = cljs.core._invoke[goog.typeOf(x__2387__auto____6246)];
        if(or__3824__auto____6247) {
          return or__3824__auto____6247
        }else {
          var or__3824__auto____6248 = cljs.core._invoke["_"];
          if(or__3824__auto____6248) {
            return or__3824__auto____6248
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____6249 = this$;
      if(and__3822__auto____6249) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____6249
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2387__auto____6250 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6251 = cljs.core._invoke[goog.typeOf(x__2387__auto____6250)];
        if(or__3824__auto____6251) {
          return or__3824__auto____6251
        }else {
          var or__3824__auto____6252 = cljs.core._invoke["_"];
          if(or__3824__auto____6252) {
            return or__3824__auto____6252
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____6253 = this$;
      if(and__3822__auto____6253) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____6253
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2387__auto____6254 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6255 = cljs.core._invoke[goog.typeOf(x__2387__auto____6254)];
        if(or__3824__auto____6255) {
          return or__3824__auto____6255
        }else {
          var or__3824__auto____6256 = cljs.core._invoke["_"];
          if(or__3824__auto____6256) {
            return or__3824__auto____6256
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____6257 = this$;
      if(and__3822__auto____6257) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____6257
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2387__auto____6258 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6259 = cljs.core._invoke[goog.typeOf(x__2387__auto____6258)];
        if(or__3824__auto____6259) {
          return or__3824__auto____6259
        }else {
          var or__3824__auto____6260 = cljs.core._invoke["_"];
          if(or__3824__auto____6260) {
            return or__3824__auto____6260
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____6261 = this$;
      if(and__3822__auto____6261) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____6261
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2387__auto____6262 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6263 = cljs.core._invoke[goog.typeOf(x__2387__auto____6262)];
        if(or__3824__auto____6263) {
          return or__3824__auto____6263
        }else {
          var or__3824__auto____6264 = cljs.core._invoke["_"];
          if(or__3824__auto____6264) {
            return or__3824__auto____6264
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____6265 = this$;
      if(and__3822__auto____6265) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____6265
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2387__auto____6266 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6267 = cljs.core._invoke[goog.typeOf(x__2387__auto____6266)];
        if(or__3824__auto____6267) {
          return or__3824__auto____6267
        }else {
          var or__3824__auto____6268 = cljs.core._invoke["_"];
          if(or__3824__auto____6268) {
            return or__3824__auto____6268
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____6269 = this$;
      if(and__3822__auto____6269) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____6269
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2387__auto____6270 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6271 = cljs.core._invoke[goog.typeOf(x__2387__auto____6270)];
        if(or__3824__auto____6271) {
          return or__3824__auto____6271
        }else {
          var or__3824__auto____6272 = cljs.core._invoke["_"];
          if(or__3824__auto____6272) {
            return or__3824__auto____6272
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____6273 = this$;
      if(and__3822__auto____6273) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____6273
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2387__auto____6274 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6275 = cljs.core._invoke[goog.typeOf(x__2387__auto____6274)];
        if(or__3824__auto____6275) {
          return or__3824__auto____6275
        }else {
          var or__3824__auto____6276 = cljs.core._invoke["_"];
          if(or__3824__auto____6276) {
            return or__3824__auto____6276
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____6277 = this$;
      if(and__3822__auto____6277) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____6277
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2387__auto____6278 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6279 = cljs.core._invoke[goog.typeOf(x__2387__auto____6278)];
        if(or__3824__auto____6279) {
          return or__3824__auto____6279
        }else {
          var or__3824__auto____6280 = cljs.core._invoke["_"];
          if(or__3824__auto____6280) {
            return or__3824__auto____6280
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____6281 = this$;
      if(and__3822__auto____6281) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____6281
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2387__auto____6282 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6283 = cljs.core._invoke[goog.typeOf(x__2387__auto____6282)];
        if(or__3824__auto____6283) {
          return or__3824__auto____6283
        }else {
          var or__3824__auto____6284 = cljs.core._invoke["_"];
          if(or__3824__auto____6284) {
            return or__3824__auto____6284
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____6285 = this$;
      if(and__3822__auto____6285) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____6285
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2387__auto____6286 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6287 = cljs.core._invoke[goog.typeOf(x__2387__auto____6286)];
        if(or__3824__auto____6287) {
          return or__3824__auto____6287
        }else {
          var or__3824__auto____6288 = cljs.core._invoke["_"];
          if(or__3824__auto____6288) {
            return or__3824__auto____6288
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____6289 = this$;
      if(and__3822__auto____6289) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____6289
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2387__auto____6290 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6291 = cljs.core._invoke[goog.typeOf(x__2387__auto____6290)];
        if(or__3824__auto____6291) {
          return or__3824__auto____6291
        }else {
          var or__3824__auto____6292 = cljs.core._invoke["_"];
          if(or__3824__auto____6292) {
            return or__3824__auto____6292
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____6293 = this$;
      if(and__3822__auto____6293) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____6293
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2387__auto____6294 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6295 = cljs.core._invoke[goog.typeOf(x__2387__auto____6294)];
        if(or__3824__auto____6295) {
          return or__3824__auto____6295
        }else {
          var or__3824__auto____6296 = cljs.core._invoke["_"];
          if(or__3824__auto____6296) {
            return or__3824__auto____6296
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____6297 = this$;
      if(and__3822__auto____6297) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____6297
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2387__auto____6298 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6299 = cljs.core._invoke[goog.typeOf(x__2387__auto____6298)];
        if(or__3824__auto____6299) {
          return or__3824__auto____6299
        }else {
          var or__3824__auto____6300 = cljs.core._invoke["_"];
          if(or__3824__auto____6300) {
            return or__3824__auto____6300
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____6301 = this$;
      if(and__3822__auto____6301) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____6301
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2387__auto____6302 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6303 = cljs.core._invoke[goog.typeOf(x__2387__auto____6302)];
        if(or__3824__auto____6303) {
          return or__3824__auto____6303
        }else {
          var or__3824__auto____6304 = cljs.core._invoke["_"];
          if(or__3824__auto____6304) {
            return or__3824__auto____6304
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____6305 = this$;
      if(and__3822__auto____6305) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____6305
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2387__auto____6306 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6307 = cljs.core._invoke[goog.typeOf(x__2387__auto____6306)];
        if(or__3824__auto____6307) {
          return or__3824__auto____6307
        }else {
          var or__3824__auto____6308 = cljs.core._invoke["_"];
          if(or__3824__auto____6308) {
            return or__3824__auto____6308
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____6309 = this$;
      if(and__3822__auto____6309) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____6309
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2387__auto____6310 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6311 = cljs.core._invoke[goog.typeOf(x__2387__auto____6310)];
        if(or__3824__auto____6311) {
          return or__3824__auto____6311
        }else {
          var or__3824__auto____6312 = cljs.core._invoke["_"];
          if(or__3824__auto____6312) {
            return or__3824__auto____6312
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____6313 = this$;
      if(and__3822__auto____6313) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____6313
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2387__auto____6314 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6315 = cljs.core._invoke[goog.typeOf(x__2387__auto____6314)];
        if(or__3824__auto____6315) {
          return or__3824__auto____6315
        }else {
          var or__3824__auto____6316 = cljs.core._invoke["_"];
          if(or__3824__auto____6316) {
            return or__3824__auto____6316
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____6317 = this$;
      if(and__3822__auto____6317) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____6317
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2387__auto____6318 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6319 = cljs.core._invoke[goog.typeOf(x__2387__auto____6318)];
        if(or__3824__auto____6319) {
          return or__3824__auto____6319
        }else {
          var or__3824__auto____6320 = cljs.core._invoke["_"];
          if(or__3824__auto____6320) {
            return or__3824__auto____6320
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____6325 = coll;
    if(and__3822__auto____6325) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____6325
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2387__auto____6326 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6327 = cljs.core._count[goog.typeOf(x__2387__auto____6326)];
      if(or__3824__auto____6327) {
        return or__3824__auto____6327
      }else {
        var or__3824__auto____6328 = cljs.core._count["_"];
        if(or__3824__auto____6328) {
          return or__3824__auto____6328
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____6333 = coll;
    if(and__3822__auto____6333) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____6333
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2387__auto____6334 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6335 = cljs.core._empty[goog.typeOf(x__2387__auto____6334)];
      if(or__3824__auto____6335) {
        return or__3824__auto____6335
      }else {
        var or__3824__auto____6336 = cljs.core._empty["_"];
        if(or__3824__auto____6336) {
          return or__3824__auto____6336
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____6341 = coll;
    if(and__3822__auto____6341) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____6341
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2387__auto____6342 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6343 = cljs.core._conj[goog.typeOf(x__2387__auto____6342)];
      if(or__3824__auto____6343) {
        return or__3824__auto____6343
      }else {
        var or__3824__auto____6344 = cljs.core._conj["_"];
        if(or__3824__auto____6344) {
          return or__3824__auto____6344
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____6353 = coll;
      if(and__3822__auto____6353) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____6353
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2387__auto____6354 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6355 = cljs.core._nth[goog.typeOf(x__2387__auto____6354)];
        if(or__3824__auto____6355) {
          return or__3824__auto____6355
        }else {
          var or__3824__auto____6356 = cljs.core._nth["_"];
          if(or__3824__auto____6356) {
            return or__3824__auto____6356
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____6357 = coll;
      if(and__3822__auto____6357) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____6357
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2387__auto____6358 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6359 = cljs.core._nth[goog.typeOf(x__2387__auto____6358)];
        if(or__3824__auto____6359) {
          return or__3824__auto____6359
        }else {
          var or__3824__auto____6360 = cljs.core._nth["_"];
          if(or__3824__auto____6360) {
            return or__3824__auto____6360
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____6365 = coll;
    if(and__3822__auto____6365) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____6365
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2387__auto____6366 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6367 = cljs.core._first[goog.typeOf(x__2387__auto____6366)];
      if(or__3824__auto____6367) {
        return or__3824__auto____6367
      }else {
        var or__3824__auto____6368 = cljs.core._first["_"];
        if(or__3824__auto____6368) {
          return or__3824__auto____6368
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____6373 = coll;
    if(and__3822__auto____6373) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____6373
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2387__auto____6374 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6375 = cljs.core._rest[goog.typeOf(x__2387__auto____6374)];
      if(or__3824__auto____6375) {
        return or__3824__auto____6375
      }else {
        var or__3824__auto____6376 = cljs.core._rest["_"];
        if(or__3824__auto____6376) {
          return or__3824__auto____6376
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto____6381 = coll;
    if(and__3822__auto____6381) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____6381
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2387__auto____6382 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6383 = cljs.core._next[goog.typeOf(x__2387__auto____6382)];
      if(or__3824__auto____6383) {
        return or__3824__auto____6383
      }else {
        var or__3824__auto____6384 = cljs.core._next["_"];
        if(or__3824__auto____6384) {
          return or__3824__auto____6384
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____6393 = o;
      if(and__3822__auto____6393) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____6393
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2387__auto____6394 = o == null ? null : o;
      return function() {
        var or__3824__auto____6395 = cljs.core._lookup[goog.typeOf(x__2387__auto____6394)];
        if(or__3824__auto____6395) {
          return or__3824__auto____6395
        }else {
          var or__3824__auto____6396 = cljs.core._lookup["_"];
          if(or__3824__auto____6396) {
            return or__3824__auto____6396
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____6397 = o;
      if(and__3822__auto____6397) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____6397
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2387__auto____6398 = o == null ? null : o;
      return function() {
        var or__3824__auto____6399 = cljs.core._lookup[goog.typeOf(x__2387__auto____6398)];
        if(or__3824__auto____6399) {
          return or__3824__auto____6399
        }else {
          var or__3824__auto____6400 = cljs.core._lookup["_"];
          if(or__3824__auto____6400) {
            return or__3824__auto____6400
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____6405 = coll;
    if(and__3822__auto____6405) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____6405
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2387__auto____6406 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6407 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2387__auto____6406)];
      if(or__3824__auto____6407) {
        return or__3824__auto____6407
      }else {
        var or__3824__auto____6408 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____6408) {
          return or__3824__auto____6408
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____6413 = coll;
    if(and__3822__auto____6413) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____6413
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2387__auto____6414 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6415 = cljs.core._assoc[goog.typeOf(x__2387__auto____6414)];
      if(or__3824__auto____6415) {
        return or__3824__auto____6415
      }else {
        var or__3824__auto____6416 = cljs.core._assoc["_"];
        if(or__3824__auto____6416) {
          return or__3824__auto____6416
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____6421 = coll;
    if(and__3822__auto____6421) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____6421
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2387__auto____6422 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6423 = cljs.core._dissoc[goog.typeOf(x__2387__auto____6422)];
      if(or__3824__auto____6423) {
        return or__3824__auto____6423
      }else {
        var or__3824__auto____6424 = cljs.core._dissoc["_"];
        if(or__3824__auto____6424) {
          return or__3824__auto____6424
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____6429 = coll;
    if(and__3822__auto____6429) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____6429
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2387__auto____6430 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6431 = cljs.core._key[goog.typeOf(x__2387__auto____6430)];
      if(or__3824__auto____6431) {
        return or__3824__auto____6431
      }else {
        var or__3824__auto____6432 = cljs.core._key["_"];
        if(or__3824__auto____6432) {
          return or__3824__auto____6432
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____6437 = coll;
    if(and__3822__auto____6437) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____6437
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2387__auto____6438 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6439 = cljs.core._val[goog.typeOf(x__2387__auto____6438)];
      if(or__3824__auto____6439) {
        return or__3824__auto____6439
      }else {
        var or__3824__auto____6440 = cljs.core._val["_"];
        if(or__3824__auto____6440) {
          return or__3824__auto____6440
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____6445 = coll;
    if(and__3822__auto____6445) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____6445
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2387__auto____6446 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6447 = cljs.core._disjoin[goog.typeOf(x__2387__auto____6446)];
      if(or__3824__auto____6447) {
        return or__3824__auto____6447
      }else {
        var or__3824__auto____6448 = cljs.core._disjoin["_"];
        if(or__3824__auto____6448) {
          return or__3824__auto____6448
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____6453 = coll;
    if(and__3822__auto____6453) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____6453
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2387__auto____6454 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6455 = cljs.core._peek[goog.typeOf(x__2387__auto____6454)];
      if(or__3824__auto____6455) {
        return or__3824__auto____6455
      }else {
        var or__3824__auto____6456 = cljs.core._peek["_"];
        if(or__3824__auto____6456) {
          return or__3824__auto____6456
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____6461 = coll;
    if(and__3822__auto____6461) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____6461
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2387__auto____6462 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6463 = cljs.core._pop[goog.typeOf(x__2387__auto____6462)];
      if(or__3824__auto____6463) {
        return or__3824__auto____6463
      }else {
        var or__3824__auto____6464 = cljs.core._pop["_"];
        if(or__3824__auto____6464) {
          return or__3824__auto____6464
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____6469 = coll;
    if(and__3822__auto____6469) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____6469
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2387__auto____6470 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6471 = cljs.core._assoc_n[goog.typeOf(x__2387__auto____6470)];
      if(or__3824__auto____6471) {
        return or__3824__auto____6471
      }else {
        var or__3824__auto____6472 = cljs.core._assoc_n["_"];
        if(or__3824__auto____6472) {
          return or__3824__auto____6472
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____6477 = o;
    if(and__3822__auto____6477) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____6477
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2387__auto____6478 = o == null ? null : o;
    return function() {
      var or__3824__auto____6479 = cljs.core._deref[goog.typeOf(x__2387__auto____6478)];
      if(or__3824__auto____6479) {
        return or__3824__auto____6479
      }else {
        var or__3824__auto____6480 = cljs.core._deref["_"];
        if(or__3824__auto____6480) {
          return or__3824__auto____6480
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____6485 = o;
    if(and__3822__auto____6485) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____6485
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2387__auto____6486 = o == null ? null : o;
    return function() {
      var or__3824__auto____6487 = cljs.core._deref_with_timeout[goog.typeOf(x__2387__auto____6486)];
      if(or__3824__auto____6487) {
        return or__3824__auto____6487
      }else {
        var or__3824__auto____6488 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____6488) {
          return or__3824__auto____6488
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____6493 = o;
    if(and__3822__auto____6493) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____6493
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2387__auto____6494 = o == null ? null : o;
    return function() {
      var or__3824__auto____6495 = cljs.core._meta[goog.typeOf(x__2387__auto____6494)];
      if(or__3824__auto____6495) {
        return or__3824__auto____6495
      }else {
        var or__3824__auto____6496 = cljs.core._meta["_"];
        if(or__3824__auto____6496) {
          return or__3824__auto____6496
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____6501 = o;
    if(and__3822__auto____6501) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____6501
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2387__auto____6502 = o == null ? null : o;
    return function() {
      var or__3824__auto____6503 = cljs.core._with_meta[goog.typeOf(x__2387__auto____6502)];
      if(or__3824__auto____6503) {
        return or__3824__auto____6503
      }else {
        var or__3824__auto____6504 = cljs.core._with_meta["_"];
        if(or__3824__auto____6504) {
          return or__3824__auto____6504
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____6513 = coll;
      if(and__3822__auto____6513) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____6513
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2387__auto____6514 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6515 = cljs.core._reduce[goog.typeOf(x__2387__auto____6514)];
        if(or__3824__auto____6515) {
          return or__3824__auto____6515
        }else {
          var or__3824__auto____6516 = cljs.core._reduce["_"];
          if(or__3824__auto____6516) {
            return or__3824__auto____6516
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____6517 = coll;
      if(and__3822__auto____6517) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____6517
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2387__auto____6518 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6519 = cljs.core._reduce[goog.typeOf(x__2387__auto____6518)];
        if(or__3824__auto____6519) {
          return or__3824__auto____6519
        }else {
          var or__3824__auto____6520 = cljs.core._reduce["_"];
          if(or__3824__auto____6520) {
            return or__3824__auto____6520
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____6525 = coll;
    if(and__3822__auto____6525) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____6525
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2387__auto____6526 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6527 = cljs.core._kv_reduce[goog.typeOf(x__2387__auto____6526)];
      if(or__3824__auto____6527) {
        return or__3824__auto____6527
      }else {
        var or__3824__auto____6528 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____6528) {
          return or__3824__auto____6528
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____6533 = o;
    if(and__3822__auto____6533) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____6533
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2387__auto____6534 = o == null ? null : o;
    return function() {
      var or__3824__auto____6535 = cljs.core._equiv[goog.typeOf(x__2387__auto____6534)];
      if(or__3824__auto____6535) {
        return or__3824__auto____6535
      }else {
        var or__3824__auto____6536 = cljs.core._equiv["_"];
        if(or__3824__auto____6536) {
          return or__3824__auto____6536
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____6541 = o;
    if(and__3822__auto____6541) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____6541
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2387__auto____6542 = o == null ? null : o;
    return function() {
      var or__3824__auto____6543 = cljs.core._hash[goog.typeOf(x__2387__auto____6542)];
      if(or__3824__auto____6543) {
        return or__3824__auto____6543
      }else {
        var or__3824__auto____6544 = cljs.core._hash["_"];
        if(or__3824__auto____6544) {
          return or__3824__auto____6544
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____6549 = o;
    if(and__3822__auto____6549) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____6549
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2387__auto____6550 = o == null ? null : o;
    return function() {
      var or__3824__auto____6551 = cljs.core._seq[goog.typeOf(x__2387__auto____6550)];
      if(or__3824__auto____6551) {
        return or__3824__auto____6551
      }else {
        var or__3824__auto____6552 = cljs.core._seq["_"];
        if(or__3824__auto____6552) {
          return or__3824__auto____6552
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____6557 = coll;
    if(and__3822__auto____6557) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____6557
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2387__auto____6558 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6559 = cljs.core._rseq[goog.typeOf(x__2387__auto____6558)];
      if(or__3824__auto____6559) {
        return or__3824__auto____6559
      }else {
        var or__3824__auto____6560 = cljs.core._rseq["_"];
        if(or__3824__auto____6560) {
          return or__3824__auto____6560
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6565 = coll;
    if(and__3822__auto____6565) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____6565
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2387__auto____6566 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6567 = cljs.core._sorted_seq[goog.typeOf(x__2387__auto____6566)];
      if(or__3824__auto____6567) {
        return or__3824__auto____6567
      }else {
        var or__3824__auto____6568 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____6568) {
          return or__3824__auto____6568
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6573 = coll;
    if(and__3822__auto____6573) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____6573
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2387__auto____6574 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6575 = cljs.core._sorted_seq_from[goog.typeOf(x__2387__auto____6574)];
      if(or__3824__auto____6575) {
        return or__3824__auto____6575
      }else {
        var or__3824__auto____6576 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____6576) {
          return or__3824__auto____6576
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____6581 = coll;
    if(and__3822__auto____6581) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____6581
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2387__auto____6582 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6583 = cljs.core._entry_key[goog.typeOf(x__2387__auto____6582)];
      if(or__3824__auto____6583) {
        return or__3824__auto____6583
      }else {
        var or__3824__auto____6584 = cljs.core._entry_key["_"];
        if(or__3824__auto____6584) {
          return or__3824__auto____6584
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____6589 = coll;
    if(and__3822__auto____6589) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____6589
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2387__auto____6590 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6591 = cljs.core._comparator[goog.typeOf(x__2387__auto____6590)];
      if(or__3824__auto____6591) {
        return or__3824__auto____6591
      }else {
        var or__3824__auto____6592 = cljs.core._comparator["_"];
        if(or__3824__auto____6592) {
          return or__3824__auto____6592
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____6597 = o;
    if(and__3822__auto____6597) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____6597
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2387__auto____6598 = o == null ? null : o;
    return function() {
      var or__3824__auto____6599 = cljs.core._pr_seq[goog.typeOf(x__2387__auto____6598)];
      if(or__3824__auto____6599) {
        return or__3824__auto____6599
      }else {
        var or__3824__auto____6600 = cljs.core._pr_seq["_"];
        if(or__3824__auto____6600) {
          return or__3824__auto____6600
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____6605 = d;
    if(and__3822__auto____6605) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____6605
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2387__auto____6606 = d == null ? null : d;
    return function() {
      var or__3824__auto____6607 = cljs.core._realized_QMARK_[goog.typeOf(x__2387__auto____6606)];
      if(or__3824__auto____6607) {
        return or__3824__auto____6607
      }else {
        var or__3824__auto____6608 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____6608) {
          return or__3824__auto____6608
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____6613 = this$;
    if(and__3822__auto____6613) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____6613
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2387__auto____6614 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6615 = cljs.core._notify_watches[goog.typeOf(x__2387__auto____6614)];
      if(or__3824__auto____6615) {
        return or__3824__auto____6615
      }else {
        var or__3824__auto____6616 = cljs.core._notify_watches["_"];
        if(or__3824__auto____6616) {
          return or__3824__auto____6616
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____6621 = this$;
    if(and__3822__auto____6621) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____6621
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2387__auto____6622 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6623 = cljs.core._add_watch[goog.typeOf(x__2387__auto____6622)];
      if(or__3824__auto____6623) {
        return or__3824__auto____6623
      }else {
        var or__3824__auto____6624 = cljs.core._add_watch["_"];
        if(or__3824__auto____6624) {
          return or__3824__auto____6624
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____6629 = this$;
    if(and__3822__auto____6629) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____6629
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2387__auto____6630 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6631 = cljs.core._remove_watch[goog.typeOf(x__2387__auto____6630)];
      if(or__3824__auto____6631) {
        return or__3824__auto____6631
      }else {
        var or__3824__auto____6632 = cljs.core._remove_watch["_"];
        if(or__3824__auto____6632) {
          return or__3824__auto____6632
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____6637 = coll;
    if(and__3822__auto____6637) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____6637
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2387__auto____6638 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6639 = cljs.core._as_transient[goog.typeOf(x__2387__auto____6638)];
      if(or__3824__auto____6639) {
        return or__3824__auto____6639
      }else {
        var or__3824__auto____6640 = cljs.core._as_transient["_"];
        if(or__3824__auto____6640) {
          return or__3824__auto____6640
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____6645 = tcoll;
    if(and__3822__auto____6645) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____6645
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2387__auto____6646 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6647 = cljs.core._conj_BANG_[goog.typeOf(x__2387__auto____6646)];
      if(or__3824__auto____6647) {
        return or__3824__auto____6647
      }else {
        var or__3824__auto____6648 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____6648) {
          return or__3824__auto____6648
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6653 = tcoll;
    if(and__3822__auto____6653) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____6653
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2387__auto____6654 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6655 = cljs.core._persistent_BANG_[goog.typeOf(x__2387__auto____6654)];
      if(or__3824__auto____6655) {
        return or__3824__auto____6655
      }else {
        var or__3824__auto____6656 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____6656) {
          return or__3824__auto____6656
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____6661 = tcoll;
    if(and__3822__auto____6661) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____6661
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2387__auto____6662 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6663 = cljs.core._assoc_BANG_[goog.typeOf(x__2387__auto____6662)];
      if(or__3824__auto____6663) {
        return or__3824__auto____6663
      }else {
        var or__3824__auto____6664 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____6664) {
          return or__3824__auto____6664
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____6669 = tcoll;
    if(and__3822__auto____6669) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____6669
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2387__auto____6670 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6671 = cljs.core._dissoc_BANG_[goog.typeOf(x__2387__auto____6670)];
      if(or__3824__auto____6671) {
        return or__3824__auto____6671
      }else {
        var or__3824__auto____6672 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____6672) {
          return or__3824__auto____6672
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____6677 = tcoll;
    if(and__3822__auto____6677) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____6677
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2387__auto____6678 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6679 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2387__auto____6678)];
      if(or__3824__auto____6679) {
        return or__3824__auto____6679
      }else {
        var or__3824__auto____6680 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____6680) {
          return or__3824__auto____6680
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6685 = tcoll;
    if(and__3822__auto____6685) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____6685
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2387__auto____6686 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6687 = cljs.core._pop_BANG_[goog.typeOf(x__2387__auto____6686)];
      if(or__3824__auto____6687) {
        return or__3824__auto____6687
      }else {
        var or__3824__auto____6688 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____6688) {
          return or__3824__auto____6688
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____6693 = tcoll;
    if(and__3822__auto____6693) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____6693
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2387__auto____6694 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6695 = cljs.core._disjoin_BANG_[goog.typeOf(x__2387__auto____6694)];
      if(or__3824__auto____6695) {
        return or__3824__auto____6695
      }else {
        var or__3824__auto____6696 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____6696) {
          return or__3824__auto____6696
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto____6701 = x;
    if(and__3822__auto____6701) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____6701
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2387__auto____6702 = x == null ? null : x;
    return function() {
      var or__3824__auto____6703 = cljs.core._compare[goog.typeOf(x__2387__auto____6702)];
      if(or__3824__auto____6703) {
        return or__3824__auto____6703
      }else {
        var or__3824__auto____6704 = cljs.core._compare["_"];
        if(or__3824__auto____6704) {
          return or__3824__auto____6704
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto____6709 = coll;
    if(and__3822__auto____6709) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____6709
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2387__auto____6710 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6711 = cljs.core._drop_first[goog.typeOf(x__2387__auto____6710)];
      if(or__3824__auto____6711) {
        return or__3824__auto____6711
      }else {
        var or__3824__auto____6712 = cljs.core._drop_first["_"];
        if(or__3824__auto____6712) {
          return or__3824__auto____6712
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto____6717 = coll;
    if(and__3822__auto____6717) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____6717
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2387__auto____6718 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6719 = cljs.core._chunked_first[goog.typeOf(x__2387__auto____6718)];
      if(or__3824__auto____6719) {
        return or__3824__auto____6719
      }else {
        var or__3824__auto____6720 = cljs.core._chunked_first["_"];
        if(or__3824__auto____6720) {
          return or__3824__auto____6720
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____6725 = coll;
    if(and__3822__auto____6725) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____6725
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2387__auto____6726 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6727 = cljs.core._chunked_rest[goog.typeOf(x__2387__auto____6726)];
      if(or__3824__auto____6727) {
        return or__3824__auto____6727
      }else {
        var or__3824__auto____6728 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____6728) {
          return or__3824__auto____6728
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto____6733 = coll;
    if(and__3822__auto____6733) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____6733
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2387__auto____6734 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6735 = cljs.core._chunked_next[goog.typeOf(x__2387__auto____6734)];
      if(or__3824__auto____6735) {
        return or__3824__auto____6735
      }else {
        var or__3824__auto____6736 = cljs.core._chunked_next["_"];
        if(or__3824__auto____6736) {
          return or__3824__auto____6736
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____6738 = x === y;
    if(or__3824__auto____6738) {
      return or__3824__auto____6738
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__6739__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__6740 = y;
            var G__6741 = cljs.core.first.call(null, more);
            var G__6742 = cljs.core.next.call(null, more);
            x = G__6740;
            y = G__6741;
            more = G__6742;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6739 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6739__delegate.call(this, x, y, more)
    };
    G__6739.cljs$lang$maxFixedArity = 2;
    G__6739.cljs$lang$applyTo = function(arglist__6743) {
      var x = cljs.core.first(arglist__6743);
      var y = cljs.core.first(cljs.core.next(arglist__6743));
      var more = cljs.core.rest(cljs.core.next(arglist__6743));
      return G__6739__delegate(x, y, more)
    };
    G__6739.cljs$lang$arity$variadic = G__6739__delegate;
    return G__6739
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__6744 = null;
  var G__6744__2 = function(o, k) {
    return null
  };
  var G__6744__3 = function(o, k, not_found) {
    return not_found
  };
  G__6744 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6744__2.call(this, o, k);
      case 3:
        return G__6744__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6744
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__6745 = null;
  var G__6745__2 = function(_, f) {
    return f.call(null)
  };
  var G__6745__3 = function(_, f, start) {
    return start
  };
  G__6745 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6745__2.call(this, _, f);
      case 3:
        return G__6745__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6745
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__6746 = null;
  var G__6746__2 = function(_, n) {
    return null
  };
  var G__6746__3 = function(_, n, not_found) {
    return not_found
  };
  G__6746 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6746__2.call(this, _, n);
      case 3:
        return G__6746__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6746
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3822__auto____6747 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____6747) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____6747
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__6760 = cljs.core._count.call(null, cicoll);
    if(cnt__6760 === 0) {
      return f.call(null)
    }else {
      var val__6761 = cljs.core._nth.call(null, cicoll, 0);
      var n__6762 = 1;
      while(true) {
        if(n__6762 < cnt__6760) {
          var nval__6763 = f.call(null, val__6761, cljs.core._nth.call(null, cicoll, n__6762));
          if(cljs.core.reduced_QMARK_.call(null, nval__6763)) {
            return cljs.core.deref.call(null, nval__6763)
          }else {
            var G__6772 = nval__6763;
            var G__6773 = n__6762 + 1;
            val__6761 = G__6772;
            n__6762 = G__6773;
            continue
          }
        }else {
          return val__6761
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__6764 = cljs.core._count.call(null, cicoll);
    var val__6765 = val;
    var n__6766 = 0;
    while(true) {
      if(n__6766 < cnt__6764) {
        var nval__6767 = f.call(null, val__6765, cljs.core._nth.call(null, cicoll, n__6766));
        if(cljs.core.reduced_QMARK_.call(null, nval__6767)) {
          return cljs.core.deref.call(null, nval__6767)
        }else {
          var G__6774 = nval__6767;
          var G__6775 = n__6766 + 1;
          val__6765 = G__6774;
          n__6766 = G__6775;
          continue
        }
      }else {
        return val__6765
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__6768 = cljs.core._count.call(null, cicoll);
    var val__6769 = val;
    var n__6770 = idx;
    while(true) {
      if(n__6770 < cnt__6768) {
        var nval__6771 = f.call(null, val__6769, cljs.core._nth.call(null, cicoll, n__6770));
        if(cljs.core.reduced_QMARK_.call(null, nval__6771)) {
          return cljs.core.deref.call(null, nval__6771)
        }else {
          var G__6776 = nval__6771;
          var G__6777 = n__6770 + 1;
          val__6769 = G__6776;
          n__6770 = G__6777;
          continue
        }
      }else {
        return val__6769
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__6790 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__6791 = arr[0];
      var n__6792 = 1;
      while(true) {
        if(n__6792 < cnt__6790) {
          var nval__6793 = f.call(null, val__6791, arr[n__6792]);
          if(cljs.core.reduced_QMARK_.call(null, nval__6793)) {
            return cljs.core.deref.call(null, nval__6793)
          }else {
            var G__6802 = nval__6793;
            var G__6803 = n__6792 + 1;
            val__6791 = G__6802;
            n__6792 = G__6803;
            continue
          }
        }else {
          return val__6791
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__6794 = arr.length;
    var val__6795 = val;
    var n__6796 = 0;
    while(true) {
      if(n__6796 < cnt__6794) {
        var nval__6797 = f.call(null, val__6795, arr[n__6796]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6797)) {
          return cljs.core.deref.call(null, nval__6797)
        }else {
          var G__6804 = nval__6797;
          var G__6805 = n__6796 + 1;
          val__6795 = G__6804;
          n__6796 = G__6805;
          continue
        }
      }else {
        return val__6795
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__6798 = arr.length;
    var val__6799 = val;
    var n__6800 = idx;
    while(true) {
      if(n__6800 < cnt__6798) {
        var nval__6801 = f.call(null, val__6799, arr[n__6800]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6801)) {
          return cljs.core.deref.call(null, nval__6801)
        }else {
          var G__6806 = nval__6801;
          var G__6807 = n__6800 + 1;
          val__6799 = G__6806;
          n__6800 = G__6807;
          continue
        }
      }else {
        return val__6799
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6808 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__6809 = this;
  if(this__6809.i + 1 < this__6809.a.length) {
    return new cljs.core.IndexedSeq(this__6809.a, this__6809.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6810 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6811 = this;
  var c__6812 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__6812 > 0) {
    return new cljs.core.RSeq(coll, c__6812 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__6813 = this;
  var this__6814 = this;
  return cljs.core.pr_str.call(null, this__6814)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__6815 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6815.a)) {
    return cljs.core.ci_reduce.call(null, this__6815.a, f, this__6815.a[this__6815.i], this__6815.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__6815.a[this__6815.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__6816 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6816.a)) {
    return cljs.core.ci_reduce.call(null, this__6816.a, f, start, this__6816.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6817 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__6818 = this;
  return this__6818.a.length - this__6818.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__6819 = this;
  return this__6819.a[this__6819.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__6820 = this;
  if(this__6820.i + 1 < this__6820.a.length) {
    return new cljs.core.IndexedSeq(this__6820.a, this__6820.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6821 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__6822 = this;
  var i__6823 = n + this__6822.i;
  if(i__6823 < this__6822.a.length) {
    return this__6822.a[i__6823]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__6824 = this;
  var i__6825 = n + this__6824.i;
  if(i__6825 < this__6824.a.length) {
    return this__6824.a[i__6825]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__6826 = null;
  var G__6826__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__6826__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__6826 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6826__2.call(this, array, f);
      case 3:
        return G__6826__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6826
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__6827 = null;
  var G__6827__2 = function(array, k) {
    return array[k]
  };
  var G__6827__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__6827 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6827__2.call(this, array, k);
      case 3:
        return G__6827__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6827
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__6828 = null;
  var G__6828__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__6828__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__6828 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6828__2.call(this, array, n);
      case 3:
        return G__6828__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6828
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6829 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6830 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__6831 = this;
  var this__6832 = this;
  return cljs.core.pr_str.call(null, this__6832)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6833 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6834 = this;
  return this__6834.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6835 = this;
  return cljs.core._nth.call(null, this__6835.ci, this__6835.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6836 = this;
  if(this__6836.i > 0) {
    return new cljs.core.RSeq(this__6836.ci, this__6836.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6837 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__6838 = this;
  return new cljs.core.RSeq(this__6838.ci, this__6838.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6839 = this;
  return this__6839.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6843__6844 = coll;
      if(G__6843__6844) {
        if(function() {
          var or__3824__auto____6845 = G__6843__6844.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____6845) {
            return or__3824__auto____6845
          }else {
            return G__6843__6844.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__6843__6844.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6843__6844)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6843__6844)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6850__6851 = coll;
      if(G__6850__6851) {
        if(function() {
          var or__3824__auto____6852 = G__6850__6851.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6852) {
            return or__3824__auto____6852
          }else {
            return G__6850__6851.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6850__6851.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6850__6851)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6850__6851)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__6853 = cljs.core.seq.call(null, coll);
      if(s__6853 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__6853)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__6858__6859 = coll;
      if(G__6858__6859) {
        if(function() {
          var or__3824__auto____6860 = G__6858__6859.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6860) {
            return or__3824__auto____6860
          }else {
            return G__6858__6859.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6858__6859.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6858__6859)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6858__6859)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__6861 = cljs.core.seq.call(null, coll);
      if(!(s__6861 == null)) {
        return cljs.core._rest.call(null, s__6861)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6865__6866 = coll;
      if(G__6865__6866) {
        if(function() {
          var or__3824__auto____6867 = G__6865__6866.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____6867) {
            return or__3824__auto____6867
          }else {
            return G__6865__6866.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__6865__6866.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6865__6866)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6865__6866)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__6869 = cljs.core.next.call(null, s);
    if(!(sn__6869 == null)) {
      var G__6870 = sn__6869;
      s = G__6870;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__6871__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__6872 = conj.call(null, coll, x);
          var G__6873 = cljs.core.first.call(null, xs);
          var G__6874 = cljs.core.next.call(null, xs);
          coll = G__6872;
          x = G__6873;
          xs = G__6874;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__6871 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6871__delegate.call(this, coll, x, xs)
    };
    G__6871.cljs$lang$maxFixedArity = 2;
    G__6871.cljs$lang$applyTo = function(arglist__6875) {
      var coll = cljs.core.first(arglist__6875);
      var x = cljs.core.first(cljs.core.next(arglist__6875));
      var xs = cljs.core.rest(cljs.core.next(arglist__6875));
      return G__6871__delegate(coll, x, xs)
    };
    G__6871.cljs$lang$arity$variadic = G__6871__delegate;
    return G__6871
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__6878 = cljs.core.seq.call(null, coll);
  var acc__6879 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__6878)) {
      return acc__6879 + cljs.core._count.call(null, s__6878)
    }else {
      var G__6880 = cljs.core.next.call(null, s__6878);
      var G__6881 = acc__6879 + 1;
      s__6878 = G__6880;
      acc__6879 = G__6881;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__6888__6889 = coll;
        if(G__6888__6889) {
          if(function() {
            var or__3824__auto____6890 = G__6888__6889.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6890) {
              return or__3824__auto____6890
            }else {
              return G__6888__6889.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6888__6889.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6888__6889)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6888__6889)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__6891__6892 = coll;
        if(G__6891__6892) {
          if(function() {
            var or__3824__auto____6893 = G__6891__6892.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6893) {
              return or__3824__auto____6893
            }else {
              return G__6891__6892.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6891__6892.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6891__6892)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6891__6892)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__6896__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__6895 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__6897 = ret__6895;
          var G__6898 = cljs.core.first.call(null, kvs);
          var G__6899 = cljs.core.second.call(null, kvs);
          var G__6900 = cljs.core.nnext.call(null, kvs);
          coll = G__6897;
          k = G__6898;
          v = G__6899;
          kvs = G__6900;
          continue
        }else {
          return ret__6895
        }
        break
      }
    };
    var G__6896 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6896__delegate.call(this, coll, k, v, kvs)
    };
    G__6896.cljs$lang$maxFixedArity = 3;
    G__6896.cljs$lang$applyTo = function(arglist__6901) {
      var coll = cljs.core.first(arglist__6901);
      var k = cljs.core.first(cljs.core.next(arglist__6901));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6901)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6901)));
      return G__6896__delegate(coll, k, v, kvs)
    };
    G__6896.cljs$lang$arity$variadic = G__6896__delegate;
    return G__6896
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__6904__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6903 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6905 = ret__6903;
          var G__6906 = cljs.core.first.call(null, ks);
          var G__6907 = cljs.core.next.call(null, ks);
          coll = G__6905;
          k = G__6906;
          ks = G__6907;
          continue
        }else {
          return ret__6903
        }
        break
      }
    };
    var G__6904 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6904__delegate.call(this, coll, k, ks)
    };
    G__6904.cljs$lang$maxFixedArity = 2;
    G__6904.cljs$lang$applyTo = function(arglist__6908) {
      var coll = cljs.core.first(arglist__6908);
      var k = cljs.core.first(cljs.core.next(arglist__6908));
      var ks = cljs.core.rest(cljs.core.next(arglist__6908));
      return G__6904__delegate(coll, k, ks)
    };
    G__6904.cljs$lang$arity$variadic = G__6904__delegate;
    return G__6904
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__6912__6913 = o;
    if(G__6912__6913) {
      if(function() {
        var or__3824__auto____6914 = G__6912__6913.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____6914) {
          return or__3824__auto____6914
        }else {
          return G__6912__6913.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__6912__6913.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6912__6913)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6912__6913)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__6917__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6916 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6918 = ret__6916;
          var G__6919 = cljs.core.first.call(null, ks);
          var G__6920 = cljs.core.next.call(null, ks);
          coll = G__6918;
          k = G__6919;
          ks = G__6920;
          continue
        }else {
          return ret__6916
        }
        break
      }
    };
    var G__6917 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6917__delegate.call(this, coll, k, ks)
    };
    G__6917.cljs$lang$maxFixedArity = 2;
    G__6917.cljs$lang$applyTo = function(arglist__6921) {
      var coll = cljs.core.first(arglist__6921);
      var k = cljs.core.first(cljs.core.next(arglist__6921));
      var ks = cljs.core.rest(cljs.core.next(arglist__6921));
      return G__6917__delegate(coll, k, ks)
    };
    G__6917.cljs$lang$arity$variadic = G__6917__delegate;
    return G__6917
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__6923 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__6923;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__6923
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__6925 = cljs.core.string_hash_cache[k];
  if(!(h__6925 == null)) {
    return h__6925
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____6927 = goog.isString(o);
      if(and__3822__auto____6927) {
        return check_cache
      }else {
        return and__3822__auto____6927
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6931__6932 = x;
    if(G__6931__6932) {
      if(function() {
        var or__3824__auto____6933 = G__6931__6932.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____6933) {
          return or__3824__auto____6933
        }else {
          return G__6931__6932.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__6931__6932.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6931__6932)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6931__6932)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6937__6938 = x;
    if(G__6937__6938) {
      if(function() {
        var or__3824__auto____6939 = G__6937__6938.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____6939) {
          return or__3824__auto____6939
        }else {
          return G__6937__6938.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__6937__6938.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6937__6938)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6937__6938)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__6943__6944 = x;
  if(G__6943__6944) {
    if(function() {
      var or__3824__auto____6945 = G__6943__6944.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____6945) {
        return or__3824__auto____6945
      }else {
        return G__6943__6944.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__6943__6944.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6943__6944)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6943__6944)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__6949__6950 = x;
  if(G__6949__6950) {
    if(function() {
      var or__3824__auto____6951 = G__6949__6950.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____6951) {
        return or__3824__auto____6951
      }else {
        return G__6949__6950.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__6949__6950.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6949__6950)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6949__6950)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__6955__6956 = x;
  if(G__6955__6956) {
    if(function() {
      var or__3824__auto____6957 = G__6955__6956.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____6957) {
        return or__3824__auto____6957
      }else {
        return G__6955__6956.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__6955__6956.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6955__6956)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6955__6956)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__6961__6962 = x;
  if(G__6961__6962) {
    if(function() {
      var or__3824__auto____6963 = G__6961__6962.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____6963) {
        return or__3824__auto____6963
      }else {
        return G__6961__6962.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__6961__6962.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6961__6962)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6961__6962)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__6967__6968 = x;
  if(G__6967__6968) {
    if(function() {
      var or__3824__auto____6969 = G__6967__6968.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____6969) {
        return or__3824__auto____6969
      }else {
        return G__6967__6968.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__6967__6968.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6967__6968)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6967__6968)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6973__6974 = x;
    if(G__6973__6974) {
      if(function() {
        var or__3824__auto____6975 = G__6973__6974.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____6975) {
          return or__3824__auto____6975
        }else {
          return G__6973__6974.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__6973__6974.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6973__6974)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6973__6974)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__6979__6980 = x;
  if(G__6979__6980) {
    if(function() {
      var or__3824__auto____6981 = G__6979__6980.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____6981) {
        return or__3824__auto____6981
      }else {
        return G__6979__6980.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__6979__6980.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6979__6980)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6979__6980)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__6985__6986 = x;
  if(G__6985__6986) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____6987 = null;
      if(cljs.core.truth_(or__3824__auto____6987)) {
        return or__3824__auto____6987
      }else {
        return G__6985__6986.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__6985__6986.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6985__6986)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6985__6986)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__6988__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__6988 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6988__delegate.call(this, keyvals)
    };
    G__6988.cljs$lang$maxFixedArity = 0;
    G__6988.cljs$lang$applyTo = function(arglist__6989) {
      var keyvals = cljs.core.seq(arglist__6989);
      return G__6988__delegate(keyvals)
    };
    G__6988.cljs$lang$arity$variadic = G__6988__delegate;
    return G__6988
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__6991 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__6991.push(key)
  });
  return keys__6991
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__6995 = i;
  var j__6996 = j;
  var len__6997 = len;
  while(true) {
    if(len__6997 === 0) {
      return to
    }else {
      to[j__6996] = from[i__6995];
      var G__6998 = i__6995 + 1;
      var G__6999 = j__6996 + 1;
      var G__7000 = len__6997 - 1;
      i__6995 = G__6998;
      j__6996 = G__6999;
      len__6997 = G__7000;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__7004 = i + (len - 1);
  var j__7005 = j + (len - 1);
  var len__7006 = len;
  while(true) {
    if(len__7006 === 0) {
      return to
    }else {
      to[j__7005] = from[i__7004];
      var G__7007 = i__7004 - 1;
      var G__7008 = j__7005 - 1;
      var G__7009 = len__7006 - 1;
      i__7004 = G__7007;
      j__7005 = G__7008;
      len__7006 = G__7009;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__7013__7014 = s;
    if(G__7013__7014) {
      if(function() {
        var or__3824__auto____7015 = G__7013__7014.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____7015) {
          return or__3824__auto____7015
        }else {
          return G__7013__7014.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__7013__7014.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7013__7014)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7013__7014)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__7019__7020 = s;
  if(G__7019__7020) {
    if(function() {
      var or__3824__auto____7021 = G__7019__7020.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____7021) {
        return or__3824__auto____7021
      }else {
        return G__7019__7020.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__7019__7020.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7019__7020)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7019__7020)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____7024 = goog.isString(x);
  if(and__3822__auto____7024) {
    return!function() {
      var or__3824__auto____7025 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____7025) {
        return or__3824__auto____7025
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____7024
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____7027 = goog.isString(x);
  if(and__3822__auto____7027) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____7027
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____7029 = goog.isString(x);
  if(and__3822__auto____7029) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____7029
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____7034 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____7034) {
    return or__3824__auto____7034
  }else {
    var G__7035__7036 = f;
    if(G__7035__7036) {
      if(function() {
        var or__3824__auto____7037 = G__7035__7036.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____7037) {
          return or__3824__auto____7037
        }else {
          return G__7035__7036.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__7035__7036.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7035__7036)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7035__7036)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____7039 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____7039) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____7039
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____7042 = coll;
    if(cljs.core.truth_(and__3822__auto____7042)) {
      var and__3822__auto____7043 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____7043) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____7043
      }
    }else {
      return and__3822__auto____7042
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__7052__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__7048 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__7049 = more;
        while(true) {
          var x__7050 = cljs.core.first.call(null, xs__7049);
          var etc__7051 = cljs.core.next.call(null, xs__7049);
          if(cljs.core.truth_(xs__7049)) {
            if(cljs.core.contains_QMARK_.call(null, s__7048, x__7050)) {
              return false
            }else {
              var G__7053 = cljs.core.conj.call(null, s__7048, x__7050);
              var G__7054 = etc__7051;
              s__7048 = G__7053;
              xs__7049 = G__7054;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__7052 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7052__delegate.call(this, x, y, more)
    };
    G__7052.cljs$lang$maxFixedArity = 2;
    G__7052.cljs$lang$applyTo = function(arglist__7055) {
      var x = cljs.core.first(arglist__7055);
      var y = cljs.core.first(cljs.core.next(arglist__7055));
      var more = cljs.core.rest(cljs.core.next(arglist__7055));
      return G__7052__delegate(x, y, more)
    };
    G__7052.cljs$lang$arity$variadic = G__7052__delegate;
    return G__7052
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__7059__7060 = x;
            if(G__7059__7060) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____7061 = null;
                if(cljs.core.truth_(or__3824__auto____7061)) {
                  return or__3824__auto____7061
                }else {
                  return G__7059__7060.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__7059__7060.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7059__7060)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7059__7060)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__7066 = cljs.core.count.call(null, xs);
    var yl__7067 = cljs.core.count.call(null, ys);
    if(xl__7066 < yl__7067) {
      return-1
    }else {
      if(xl__7066 > yl__7067) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__7066, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7068 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____7069 = d__7068 === 0;
        if(and__3822__auto____7069) {
          return n + 1 < len
        }else {
          return and__3822__auto____7069
        }
      }()) {
        var G__7070 = xs;
        var G__7071 = ys;
        var G__7072 = len;
        var G__7073 = n + 1;
        xs = G__7070;
        ys = G__7071;
        len = G__7072;
        n = G__7073;
        continue
      }else {
        return d__7068
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__7075 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__7075)) {
        return r__7075
      }else {
        if(cljs.core.truth_(r__7075)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__7077 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__7077, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__7077)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____7083 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____7083) {
      var s__7084 = temp__3971__auto____7083;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__7084), cljs.core.next.call(null, s__7084))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7085 = val;
    var coll__7086 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__7086) {
        var nval__7087 = f.call(null, val__7085, cljs.core.first.call(null, coll__7086));
        if(cljs.core.reduced_QMARK_.call(null, nval__7087)) {
          return cljs.core.deref.call(null, nval__7087)
        }else {
          var G__7088 = nval__7087;
          var G__7089 = cljs.core.next.call(null, coll__7086);
          val__7085 = G__7088;
          coll__7086 = G__7089;
          continue
        }
      }else {
        return val__7085
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__7091 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__7091);
  return cljs.core.vec.call(null, a__7091)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7098__7099 = coll;
      if(G__7098__7099) {
        if(function() {
          var or__3824__auto____7100 = G__7098__7099.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7100) {
            return or__3824__auto____7100
          }else {
            return G__7098__7099.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7098__7099.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7098__7099)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7098__7099)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7101__7102 = coll;
      if(G__7101__7102) {
        if(function() {
          var or__3824__auto____7103 = G__7101__7102.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7103) {
            return or__3824__auto____7103
          }else {
            return G__7101__7102.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7101__7102.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7101__7102)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7101__7102)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__7104 = this;
  return this__7104.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__7105__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7105 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7105__delegate.call(this, x, y, more)
    };
    G__7105.cljs$lang$maxFixedArity = 2;
    G__7105.cljs$lang$applyTo = function(arglist__7106) {
      var x = cljs.core.first(arglist__7106);
      var y = cljs.core.first(cljs.core.next(arglist__7106));
      var more = cljs.core.rest(cljs.core.next(arglist__7106));
      return G__7105__delegate(x, y, more)
    };
    G__7105.cljs$lang$arity$variadic = G__7105__delegate;
    return G__7105
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__7107__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7107 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7107__delegate.call(this, x, y, more)
    };
    G__7107.cljs$lang$maxFixedArity = 2;
    G__7107.cljs$lang$applyTo = function(arglist__7108) {
      var x = cljs.core.first(arglist__7108);
      var y = cljs.core.first(cljs.core.next(arglist__7108));
      var more = cljs.core.rest(cljs.core.next(arglist__7108));
      return G__7107__delegate(x, y, more)
    };
    G__7107.cljs$lang$arity$variadic = G__7107__delegate;
    return G__7107
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__7109__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7109 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7109__delegate.call(this, x, y, more)
    };
    G__7109.cljs$lang$maxFixedArity = 2;
    G__7109.cljs$lang$applyTo = function(arglist__7110) {
      var x = cljs.core.first(arglist__7110);
      var y = cljs.core.first(cljs.core.next(arglist__7110));
      var more = cljs.core.rest(cljs.core.next(arglist__7110));
      return G__7109__delegate(x, y, more)
    };
    G__7109.cljs$lang$arity$variadic = G__7109__delegate;
    return G__7109
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__7111__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7111 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7111__delegate.call(this, x, y, more)
    };
    G__7111.cljs$lang$maxFixedArity = 2;
    G__7111.cljs$lang$applyTo = function(arglist__7112) {
      var x = cljs.core.first(arglist__7112);
      var y = cljs.core.first(cljs.core.next(arglist__7112));
      var more = cljs.core.rest(cljs.core.next(arglist__7112));
      return G__7111__delegate(x, y, more)
    };
    G__7111.cljs$lang$arity$variadic = G__7111__delegate;
    return G__7111
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__7113__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__7114 = y;
            var G__7115 = cljs.core.first.call(null, more);
            var G__7116 = cljs.core.next.call(null, more);
            x = G__7114;
            y = G__7115;
            more = G__7116;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7113 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7113__delegate.call(this, x, y, more)
    };
    G__7113.cljs$lang$maxFixedArity = 2;
    G__7113.cljs$lang$applyTo = function(arglist__7117) {
      var x = cljs.core.first(arglist__7117);
      var y = cljs.core.first(cljs.core.next(arglist__7117));
      var more = cljs.core.rest(cljs.core.next(arglist__7117));
      return G__7113__delegate(x, y, more)
    };
    G__7113.cljs$lang$arity$variadic = G__7113__delegate;
    return G__7113
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__7118__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7119 = y;
            var G__7120 = cljs.core.first.call(null, more);
            var G__7121 = cljs.core.next.call(null, more);
            x = G__7119;
            y = G__7120;
            more = G__7121;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7118 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7118__delegate.call(this, x, y, more)
    };
    G__7118.cljs$lang$maxFixedArity = 2;
    G__7118.cljs$lang$applyTo = function(arglist__7122) {
      var x = cljs.core.first(arglist__7122);
      var y = cljs.core.first(cljs.core.next(arglist__7122));
      var more = cljs.core.rest(cljs.core.next(arglist__7122));
      return G__7118__delegate(x, y, more)
    };
    G__7118.cljs$lang$arity$variadic = G__7118__delegate;
    return G__7118
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__7123__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__7124 = y;
            var G__7125 = cljs.core.first.call(null, more);
            var G__7126 = cljs.core.next.call(null, more);
            x = G__7124;
            y = G__7125;
            more = G__7126;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7123 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7123__delegate.call(this, x, y, more)
    };
    G__7123.cljs$lang$maxFixedArity = 2;
    G__7123.cljs$lang$applyTo = function(arglist__7127) {
      var x = cljs.core.first(arglist__7127);
      var y = cljs.core.first(cljs.core.next(arglist__7127));
      var more = cljs.core.rest(cljs.core.next(arglist__7127));
      return G__7123__delegate(x, y, more)
    };
    G__7123.cljs$lang$arity$variadic = G__7123__delegate;
    return G__7123
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__7128__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7129 = y;
            var G__7130 = cljs.core.first.call(null, more);
            var G__7131 = cljs.core.next.call(null, more);
            x = G__7129;
            y = G__7130;
            more = G__7131;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7128 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7128__delegate.call(this, x, y, more)
    };
    G__7128.cljs$lang$maxFixedArity = 2;
    G__7128.cljs$lang$applyTo = function(arglist__7132) {
      var x = cljs.core.first(arglist__7132);
      var y = cljs.core.first(cljs.core.next(arglist__7132));
      var more = cljs.core.rest(cljs.core.next(arglist__7132));
      return G__7128__delegate(x, y, more)
    };
    G__7128.cljs$lang$arity$variadic = G__7128__delegate;
    return G__7128
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__7133__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7133 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7133__delegate.call(this, x, y, more)
    };
    G__7133.cljs$lang$maxFixedArity = 2;
    G__7133.cljs$lang$applyTo = function(arglist__7134) {
      var x = cljs.core.first(arglist__7134);
      var y = cljs.core.first(cljs.core.next(arglist__7134));
      var more = cljs.core.rest(cljs.core.next(arglist__7134));
      return G__7133__delegate(x, y, more)
    };
    G__7133.cljs$lang$arity$variadic = G__7133__delegate;
    return G__7133
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__7135__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7135 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7135__delegate.call(this, x, y, more)
    };
    G__7135.cljs$lang$maxFixedArity = 2;
    G__7135.cljs$lang$applyTo = function(arglist__7136) {
      var x = cljs.core.first(arglist__7136);
      var y = cljs.core.first(cljs.core.next(arglist__7136));
      var more = cljs.core.rest(cljs.core.next(arglist__7136));
      return G__7135__delegate(x, y, more)
    };
    G__7135.cljs$lang$arity$variadic = G__7135__delegate;
    return G__7135
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__7138 = n % d;
  return cljs.core.fix.call(null, (n - rem__7138) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7140 = cljs.core.quot.call(null, n, d);
  return n - d * q__7140
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__7143 = v - (v >> 1 & 1431655765);
  var v__7144 = (v__7143 & 858993459) + (v__7143 >> 2 & 858993459);
  return(v__7144 + (v__7144 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__7145__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7146 = y;
            var G__7147 = cljs.core.first.call(null, more);
            var G__7148 = cljs.core.next.call(null, more);
            x = G__7146;
            y = G__7147;
            more = G__7148;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7145 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7145__delegate.call(this, x, y, more)
    };
    G__7145.cljs$lang$maxFixedArity = 2;
    G__7145.cljs$lang$applyTo = function(arglist__7149) {
      var x = cljs.core.first(arglist__7149);
      var y = cljs.core.first(cljs.core.next(arglist__7149));
      var more = cljs.core.rest(cljs.core.next(arglist__7149));
      return G__7145__delegate(x, y, more)
    };
    G__7145.cljs$lang$arity$variadic = G__7145__delegate;
    return G__7145
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__7153 = n;
  var xs__7154 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____7155 = xs__7154;
      if(and__3822__auto____7155) {
        return n__7153 > 0
      }else {
        return and__3822__auto____7155
      }
    }())) {
      var G__7156 = n__7153 - 1;
      var G__7157 = cljs.core.next.call(null, xs__7154);
      n__7153 = G__7156;
      xs__7154 = G__7157;
      continue
    }else {
      return xs__7154
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__7158__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7159 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__7160 = cljs.core.next.call(null, more);
            sb = G__7159;
            more = G__7160;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__7158 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7158__delegate.call(this, x, ys)
    };
    G__7158.cljs$lang$maxFixedArity = 1;
    G__7158.cljs$lang$applyTo = function(arglist__7161) {
      var x = cljs.core.first(arglist__7161);
      var ys = cljs.core.rest(arglist__7161);
      return G__7158__delegate(x, ys)
    };
    G__7158.cljs$lang$arity$variadic = G__7158__delegate;
    return G__7158
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__7162__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7163 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__7164 = cljs.core.next.call(null, more);
            sb = G__7163;
            more = G__7164;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__7162 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7162__delegate.call(this, x, ys)
    };
    G__7162.cljs$lang$maxFixedArity = 1;
    G__7162.cljs$lang$applyTo = function(arglist__7165) {
      var x = cljs.core.first(arglist__7165);
      var ys = cljs.core.rest(arglist__7165);
      return G__7162__delegate(x, ys)
    };
    G__7162.cljs$lang$arity$variadic = G__7162__delegate;
    return G__7162
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.call(null, goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__7166) {
    var fmt = cljs.core.first(arglist__7166);
    var args = cljs.core.rest(arglist__7166);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__7169 = cljs.core.seq.call(null, x);
    var ys__7170 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__7169 == null) {
        return ys__7170 == null
      }else {
        if(ys__7170 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__7169), cljs.core.first.call(null, ys__7170))) {
            var G__7171 = cljs.core.next.call(null, xs__7169);
            var G__7172 = cljs.core.next.call(null, ys__7170);
            xs__7169 = G__7171;
            ys__7170 = G__7172;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__7173_SHARP_, p2__7174_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__7173_SHARP_, cljs.core.hash.call(null, p2__7174_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__7178 = 0;
  var s__7179 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__7179) {
      var e__7180 = cljs.core.first.call(null, s__7179);
      var G__7181 = (h__7178 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__7180)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__7180)))) % 4503599627370496;
      var G__7182 = cljs.core.next.call(null, s__7179);
      h__7178 = G__7181;
      s__7179 = G__7182;
      continue
    }else {
      return h__7178
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__7186 = 0;
  var s__7187 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__7187) {
      var e__7188 = cljs.core.first.call(null, s__7187);
      var G__7189 = (h__7186 + cljs.core.hash.call(null, e__7188)) % 4503599627370496;
      var G__7190 = cljs.core.next.call(null, s__7187);
      h__7186 = G__7189;
      s__7187 = G__7190;
      continue
    }else {
      return h__7186
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__7211__7212 = cljs.core.seq.call(null, fn_map);
  if(G__7211__7212) {
    var G__7214__7216 = cljs.core.first.call(null, G__7211__7212);
    var vec__7215__7217 = G__7214__7216;
    var key_name__7218 = cljs.core.nth.call(null, vec__7215__7217, 0, null);
    var f__7219 = cljs.core.nth.call(null, vec__7215__7217, 1, null);
    var G__7211__7220 = G__7211__7212;
    var G__7214__7221 = G__7214__7216;
    var G__7211__7222 = G__7211__7220;
    while(true) {
      var vec__7223__7224 = G__7214__7221;
      var key_name__7225 = cljs.core.nth.call(null, vec__7223__7224, 0, null);
      var f__7226 = cljs.core.nth.call(null, vec__7223__7224, 1, null);
      var G__7211__7227 = G__7211__7222;
      var str_name__7228 = cljs.core.name.call(null, key_name__7225);
      obj[str_name__7228] = f__7226;
      var temp__3974__auto____7229 = cljs.core.next.call(null, G__7211__7227);
      if(temp__3974__auto____7229) {
        var G__7211__7230 = temp__3974__auto____7229;
        var G__7231 = cljs.core.first.call(null, G__7211__7230);
        var G__7232 = G__7211__7230;
        G__7214__7221 = G__7231;
        G__7211__7222 = G__7232;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7233 = this;
  var h__2216__auto____7234 = this__7233.__hash;
  if(!(h__2216__auto____7234 == null)) {
    return h__2216__auto____7234
  }else {
    var h__2216__auto____7235 = cljs.core.hash_coll.call(null, coll);
    this__7233.__hash = h__2216__auto____7235;
    return h__2216__auto____7235
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7236 = this;
  if(this__7236.count === 1) {
    return null
  }else {
    return this__7236.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7237 = this;
  return new cljs.core.List(this__7237.meta, o, coll, this__7237.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__7238 = this;
  var this__7239 = this;
  return cljs.core.pr_str.call(null, this__7239)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7240 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7241 = this;
  return this__7241.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7242 = this;
  return this__7242.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7243 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7244 = this;
  return this__7244.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7245 = this;
  if(this__7245.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__7245.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7246 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7247 = this;
  return new cljs.core.List(meta, this__7247.first, this__7247.rest, this__7247.count, this__7247.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7248 = this;
  return this__7248.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7249 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7250 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7251 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7252 = this;
  return new cljs.core.List(this__7252.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__7253 = this;
  var this__7254 = this;
  return cljs.core.pr_str.call(null, this__7254)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7255 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7256 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7257 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7258 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7259 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7260 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7261 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7262 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7263 = this;
  return this__7263.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7264 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__7268__7269 = coll;
  if(G__7268__7269) {
    if(function() {
      var or__3824__auto____7270 = G__7268__7269.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____7270) {
        return or__3824__auto____7270
      }else {
        return G__7268__7269.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__7268__7269.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7268__7269)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7268__7269)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__7271__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__7271 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7271__delegate.call(this, x, y, z, items)
    };
    G__7271.cljs$lang$maxFixedArity = 3;
    G__7271.cljs$lang$applyTo = function(arglist__7272) {
      var x = cljs.core.first(arglist__7272);
      var y = cljs.core.first(cljs.core.next(arglist__7272));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7272)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7272)));
      return G__7271__delegate(x, y, z, items)
    };
    G__7271.cljs$lang$arity$variadic = G__7271__delegate;
    return G__7271
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7273 = this;
  var h__2216__auto____7274 = this__7273.__hash;
  if(!(h__2216__auto____7274 == null)) {
    return h__2216__auto____7274
  }else {
    var h__2216__auto____7275 = cljs.core.hash_coll.call(null, coll);
    this__7273.__hash = h__2216__auto____7275;
    return h__2216__auto____7275
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7276 = this;
  if(this__7276.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__7276.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7277 = this;
  return new cljs.core.Cons(null, o, coll, this__7277.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__7278 = this;
  var this__7279 = this;
  return cljs.core.pr_str.call(null, this__7279)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7280 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7281 = this;
  return this__7281.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7282 = this;
  if(this__7282.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7282.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7283 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7284 = this;
  return new cljs.core.Cons(meta, this__7284.first, this__7284.rest, this__7284.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7285 = this;
  return this__7285.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7286 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7286.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____7291 = coll == null;
    if(or__3824__auto____7291) {
      return or__3824__auto____7291
    }else {
      var G__7292__7293 = coll;
      if(G__7292__7293) {
        if(function() {
          var or__3824__auto____7294 = G__7292__7293.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7294) {
            return or__3824__auto____7294
          }else {
            return G__7292__7293.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7292__7293.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7292__7293)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7292__7293)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__7298__7299 = x;
  if(G__7298__7299) {
    if(function() {
      var or__3824__auto____7300 = G__7298__7299.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____7300) {
        return or__3824__auto____7300
      }else {
        return G__7298__7299.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__7298__7299.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7298__7299)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7298__7299)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__7301 = null;
  var G__7301__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__7301__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__7301 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7301__2.call(this, string, f);
      case 3:
        return G__7301__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7301
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__7302 = null;
  var G__7302__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__7302__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__7302 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7302__2.call(this, string, k);
      case 3:
        return G__7302__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7302
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__7303 = null;
  var G__7303__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__7303__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__7303 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7303__2.call(this, string, n);
      case 3:
        return G__7303__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7303
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__7315 = null;
  var G__7315__2 = function(this_sym7306, coll) {
    var this__7308 = this;
    var this_sym7306__7309 = this;
    var ___7310 = this_sym7306__7309;
    if(coll == null) {
      return null
    }else {
      var strobj__7311 = coll.strobj;
      if(strobj__7311 == null) {
        return cljs.core._lookup.call(null, coll, this__7308.k, null)
      }else {
        return strobj__7311[this__7308.k]
      }
    }
  };
  var G__7315__3 = function(this_sym7307, coll, not_found) {
    var this__7308 = this;
    var this_sym7307__7312 = this;
    var ___7313 = this_sym7307__7312;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__7308.k, not_found)
    }
  };
  G__7315 = function(this_sym7307, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7315__2.call(this, this_sym7307, coll);
      case 3:
        return G__7315__3.call(this, this_sym7307, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7315
}();
cljs.core.Keyword.prototype.apply = function(this_sym7304, args7305) {
  var this__7314 = this;
  return this_sym7304.call.apply(this_sym7304, [this_sym7304].concat(args7305.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7324 = null;
  var G__7324__2 = function(this_sym7318, coll) {
    var this_sym7318__7320 = this;
    var this__7321 = this_sym7318__7320;
    return cljs.core._lookup.call(null, coll, this__7321.toString(), null)
  };
  var G__7324__3 = function(this_sym7319, coll, not_found) {
    var this_sym7319__7322 = this;
    var this__7323 = this_sym7319__7322;
    return cljs.core._lookup.call(null, coll, this__7323.toString(), not_found)
  };
  G__7324 = function(this_sym7319, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7324__2.call(this, this_sym7319, coll);
      case 3:
        return G__7324__3.call(this, this_sym7319, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7324
}();
String.prototype.apply = function(this_sym7316, args7317) {
  return this_sym7316.call.apply(this_sym7316, [this_sym7316].concat(args7317.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__7326 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__7326
  }else {
    lazy_seq.x = x__7326.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7327 = this;
  var h__2216__auto____7328 = this__7327.__hash;
  if(!(h__2216__auto____7328 == null)) {
    return h__2216__auto____7328
  }else {
    var h__2216__auto____7329 = cljs.core.hash_coll.call(null, coll);
    this__7327.__hash = h__2216__auto____7329;
    return h__2216__auto____7329
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7330 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7331 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__7332 = this;
  var this__7333 = this;
  return cljs.core.pr_str.call(null, this__7333)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7334 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7335 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7336 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7337 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7338 = this;
  return new cljs.core.LazySeq(meta, this__7338.realized, this__7338.x, this__7338.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7339 = this;
  return this__7339.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7340 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7340.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7341 = this;
  return this__7341.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__7342 = this;
  var ___7343 = this;
  this__7342.buf[this__7342.end] = o;
  return this__7342.end = this__7342.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__7344 = this;
  var ___7345 = this;
  var ret__7346 = new cljs.core.ArrayChunk(this__7344.buf, 0, this__7344.end);
  this__7344.buf = null;
  return ret__7346
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7347 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__7347.arr[this__7347.off], this__7347.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7348 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__7348.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__7349 = this;
  if(this__7349.off === this__7349.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__7349.arr, this__7349.off + 1, this__7349.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__7350 = this;
  return this__7350.arr[this__7350.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__7351 = this;
  if(function() {
    var and__3822__auto____7352 = i >= 0;
    if(and__3822__auto____7352) {
      return i < this__7351.end - this__7351.off
    }else {
      return and__3822__auto____7352
    }
  }()) {
    return this__7351.arr[this__7351.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7353 = this;
  return this__7353.end - this__7353.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__7354 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7355 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7356 = this;
  return cljs.core._nth.call(null, this__7356.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7357 = this;
  if(cljs.core._count.call(null, this__7357.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__7357.chunk), this__7357.more, this__7357.meta)
  }else {
    if(this__7357.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__7357.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7358 = this;
  if(this__7358.more == null) {
    return null
  }else {
    return this__7358.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7359 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7360 = this;
  return new cljs.core.ChunkedCons(this__7360.chunk, this__7360.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7361 = this;
  return this__7361.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7362 = this;
  return this__7362.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7363 = this;
  if(this__7363.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7363.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__7367__7368 = s;
    if(G__7367__7368) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____7369 = null;
        if(cljs.core.truth_(or__3824__auto____7369)) {
          return or__3824__auto____7369
        }else {
          return G__7367__7368.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__7367__7368.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7367__7368)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7367__7368)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__7372 = [];
  var s__7373 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__7373)) {
      ary__7372.push(cljs.core.first.call(null, s__7373));
      var G__7374 = cljs.core.next.call(null, s__7373);
      s__7373 = G__7374;
      continue
    }else {
      return ary__7372
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__7378 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__7379 = 0;
  var xs__7380 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__7380) {
      ret__7378[i__7379] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__7380));
      var G__7381 = i__7379 + 1;
      var G__7382 = cljs.core.next.call(null, xs__7380);
      i__7379 = G__7381;
      xs__7380 = G__7382;
      continue
    }else {
    }
    break
  }
  return ret__7378
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__7390 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7391 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7392 = 0;
      var s__7393 = s__7391;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7394 = s__7393;
          if(and__3822__auto____7394) {
            return i__7392 < size
          }else {
            return and__3822__auto____7394
          }
        }())) {
          a__7390[i__7392] = cljs.core.first.call(null, s__7393);
          var G__7397 = i__7392 + 1;
          var G__7398 = cljs.core.next.call(null, s__7393);
          i__7392 = G__7397;
          s__7393 = G__7398;
          continue
        }else {
          return a__7390
        }
        break
      }
    }else {
      var n__2551__auto____7395 = size;
      var i__7396 = 0;
      while(true) {
        if(i__7396 < n__2551__auto____7395) {
          a__7390[i__7396] = init_val_or_seq;
          var G__7399 = i__7396 + 1;
          i__7396 = G__7399;
          continue
        }else {
        }
        break
      }
      return a__7390
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__7407 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7408 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7409 = 0;
      var s__7410 = s__7408;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7411 = s__7410;
          if(and__3822__auto____7411) {
            return i__7409 < size
          }else {
            return and__3822__auto____7411
          }
        }())) {
          a__7407[i__7409] = cljs.core.first.call(null, s__7410);
          var G__7414 = i__7409 + 1;
          var G__7415 = cljs.core.next.call(null, s__7410);
          i__7409 = G__7414;
          s__7410 = G__7415;
          continue
        }else {
          return a__7407
        }
        break
      }
    }else {
      var n__2551__auto____7412 = size;
      var i__7413 = 0;
      while(true) {
        if(i__7413 < n__2551__auto____7412) {
          a__7407[i__7413] = init_val_or_seq;
          var G__7416 = i__7413 + 1;
          i__7413 = G__7416;
          continue
        }else {
        }
        break
      }
      return a__7407
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__7424 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7425 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7426 = 0;
      var s__7427 = s__7425;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7428 = s__7427;
          if(and__3822__auto____7428) {
            return i__7426 < size
          }else {
            return and__3822__auto____7428
          }
        }())) {
          a__7424[i__7426] = cljs.core.first.call(null, s__7427);
          var G__7431 = i__7426 + 1;
          var G__7432 = cljs.core.next.call(null, s__7427);
          i__7426 = G__7431;
          s__7427 = G__7432;
          continue
        }else {
          return a__7424
        }
        break
      }
    }else {
      var n__2551__auto____7429 = size;
      var i__7430 = 0;
      while(true) {
        if(i__7430 < n__2551__auto____7429) {
          a__7424[i__7430] = init_val_or_seq;
          var G__7433 = i__7430 + 1;
          i__7430 = G__7433;
          continue
        }else {
        }
        break
      }
      return a__7424
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__7438 = s;
    var i__7439 = n;
    var sum__7440 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____7441 = i__7439 > 0;
        if(and__3822__auto____7441) {
          return cljs.core.seq.call(null, s__7438)
        }else {
          return and__3822__auto____7441
        }
      }())) {
        var G__7442 = cljs.core.next.call(null, s__7438);
        var G__7443 = i__7439 - 1;
        var G__7444 = sum__7440 + 1;
        s__7438 = G__7442;
        i__7439 = G__7443;
        sum__7440 = G__7444;
        continue
      }else {
        return sum__7440
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__7449 = cljs.core.seq.call(null, x);
      if(s__7449) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7449)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__7449), concat.call(null, cljs.core.chunk_rest.call(null, s__7449), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__7449), concat.call(null, cljs.core.rest.call(null, s__7449), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__7453__delegate = function(x, y, zs) {
      var cat__7452 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__7451 = cljs.core.seq.call(null, xys);
          if(xys__7451) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__7451)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__7451), cat.call(null, cljs.core.chunk_rest.call(null, xys__7451), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__7451), cat.call(null, cljs.core.rest.call(null, xys__7451), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__7452.call(null, concat.call(null, x, y), zs)
    };
    var G__7453 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7453__delegate.call(this, x, y, zs)
    };
    G__7453.cljs$lang$maxFixedArity = 2;
    G__7453.cljs$lang$applyTo = function(arglist__7454) {
      var x = cljs.core.first(arglist__7454);
      var y = cljs.core.first(cljs.core.next(arglist__7454));
      var zs = cljs.core.rest(cljs.core.next(arglist__7454));
      return G__7453__delegate(x, y, zs)
    };
    G__7453.cljs$lang$arity$variadic = G__7453__delegate;
    return G__7453
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__7455__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__7455 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7455__delegate.call(this, a, b, c, d, more)
    };
    G__7455.cljs$lang$maxFixedArity = 4;
    G__7455.cljs$lang$applyTo = function(arglist__7456) {
      var a = cljs.core.first(arglist__7456);
      var b = cljs.core.first(cljs.core.next(arglist__7456));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7456)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7456))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7456))));
      return G__7455__delegate(a, b, c, d, more)
    };
    G__7455.cljs$lang$arity$variadic = G__7455__delegate;
    return G__7455
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__7498 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__7499 = cljs.core._first.call(null, args__7498);
    var args__7500 = cljs.core._rest.call(null, args__7498);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7499)
      }else {
        return f.call(null, a__7499)
      }
    }else {
      var b__7501 = cljs.core._first.call(null, args__7500);
      var args__7502 = cljs.core._rest.call(null, args__7500);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7499, b__7501)
        }else {
          return f.call(null, a__7499, b__7501)
        }
      }else {
        var c__7503 = cljs.core._first.call(null, args__7502);
        var args__7504 = cljs.core._rest.call(null, args__7502);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7499, b__7501, c__7503)
          }else {
            return f.call(null, a__7499, b__7501, c__7503)
          }
        }else {
          var d__7505 = cljs.core._first.call(null, args__7504);
          var args__7506 = cljs.core._rest.call(null, args__7504);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7499, b__7501, c__7503, d__7505)
            }else {
              return f.call(null, a__7499, b__7501, c__7503, d__7505)
            }
          }else {
            var e__7507 = cljs.core._first.call(null, args__7506);
            var args__7508 = cljs.core._rest.call(null, args__7506);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7499, b__7501, c__7503, d__7505, e__7507)
              }else {
                return f.call(null, a__7499, b__7501, c__7503, d__7505, e__7507)
              }
            }else {
              var f__7509 = cljs.core._first.call(null, args__7508);
              var args__7510 = cljs.core._rest.call(null, args__7508);
              if(argc === 6) {
                if(f__7509.cljs$lang$arity$6) {
                  return f__7509.cljs$lang$arity$6(a__7499, b__7501, c__7503, d__7505, e__7507, f__7509)
                }else {
                  return f__7509.call(null, a__7499, b__7501, c__7503, d__7505, e__7507, f__7509)
                }
              }else {
                var g__7511 = cljs.core._first.call(null, args__7510);
                var args__7512 = cljs.core._rest.call(null, args__7510);
                if(argc === 7) {
                  if(f__7509.cljs$lang$arity$7) {
                    return f__7509.cljs$lang$arity$7(a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511)
                  }else {
                    return f__7509.call(null, a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511)
                  }
                }else {
                  var h__7513 = cljs.core._first.call(null, args__7512);
                  var args__7514 = cljs.core._rest.call(null, args__7512);
                  if(argc === 8) {
                    if(f__7509.cljs$lang$arity$8) {
                      return f__7509.cljs$lang$arity$8(a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511, h__7513)
                    }else {
                      return f__7509.call(null, a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511, h__7513)
                    }
                  }else {
                    var i__7515 = cljs.core._first.call(null, args__7514);
                    var args__7516 = cljs.core._rest.call(null, args__7514);
                    if(argc === 9) {
                      if(f__7509.cljs$lang$arity$9) {
                        return f__7509.cljs$lang$arity$9(a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511, h__7513, i__7515)
                      }else {
                        return f__7509.call(null, a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511, h__7513, i__7515)
                      }
                    }else {
                      var j__7517 = cljs.core._first.call(null, args__7516);
                      var args__7518 = cljs.core._rest.call(null, args__7516);
                      if(argc === 10) {
                        if(f__7509.cljs$lang$arity$10) {
                          return f__7509.cljs$lang$arity$10(a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511, h__7513, i__7515, j__7517)
                        }else {
                          return f__7509.call(null, a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511, h__7513, i__7515, j__7517)
                        }
                      }else {
                        var k__7519 = cljs.core._first.call(null, args__7518);
                        var args__7520 = cljs.core._rest.call(null, args__7518);
                        if(argc === 11) {
                          if(f__7509.cljs$lang$arity$11) {
                            return f__7509.cljs$lang$arity$11(a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511, h__7513, i__7515, j__7517, k__7519)
                          }else {
                            return f__7509.call(null, a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511, h__7513, i__7515, j__7517, k__7519)
                          }
                        }else {
                          var l__7521 = cljs.core._first.call(null, args__7520);
                          var args__7522 = cljs.core._rest.call(null, args__7520);
                          if(argc === 12) {
                            if(f__7509.cljs$lang$arity$12) {
                              return f__7509.cljs$lang$arity$12(a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511, h__7513, i__7515, j__7517, k__7519, l__7521)
                            }else {
                              return f__7509.call(null, a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511, h__7513, i__7515, j__7517, k__7519, l__7521)
                            }
                          }else {
                            var m__7523 = cljs.core._first.call(null, args__7522);
                            var args__7524 = cljs.core._rest.call(null, args__7522);
                            if(argc === 13) {
                              if(f__7509.cljs$lang$arity$13) {
                                return f__7509.cljs$lang$arity$13(a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511, h__7513, i__7515, j__7517, k__7519, l__7521, m__7523)
                              }else {
                                return f__7509.call(null, a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511, h__7513, i__7515, j__7517, k__7519, l__7521, m__7523)
                              }
                            }else {
                              var n__7525 = cljs.core._first.call(null, args__7524);
                              var args__7526 = cljs.core._rest.call(null, args__7524);
                              if(argc === 14) {
                                if(f__7509.cljs$lang$arity$14) {
                                  return f__7509.cljs$lang$arity$14(a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511, h__7513, i__7515, j__7517, k__7519, l__7521, m__7523, n__7525)
                                }else {
                                  return f__7509.call(null, a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511, h__7513, i__7515, j__7517, k__7519, l__7521, m__7523, n__7525)
                                }
                              }else {
                                var o__7527 = cljs.core._first.call(null, args__7526);
                                var args__7528 = cljs.core._rest.call(null, args__7526);
                                if(argc === 15) {
                                  if(f__7509.cljs$lang$arity$15) {
                                    return f__7509.cljs$lang$arity$15(a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511, h__7513, i__7515, j__7517, k__7519, l__7521, m__7523, n__7525, o__7527)
                                  }else {
                                    return f__7509.call(null, a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511, h__7513, i__7515, j__7517, k__7519, l__7521, m__7523, n__7525, o__7527)
                                  }
                                }else {
                                  var p__7529 = cljs.core._first.call(null, args__7528);
                                  var args__7530 = cljs.core._rest.call(null, args__7528);
                                  if(argc === 16) {
                                    if(f__7509.cljs$lang$arity$16) {
                                      return f__7509.cljs$lang$arity$16(a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511, h__7513, i__7515, j__7517, k__7519, l__7521, m__7523, n__7525, o__7527, p__7529)
                                    }else {
                                      return f__7509.call(null, a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511, h__7513, i__7515, j__7517, k__7519, l__7521, m__7523, n__7525, o__7527, p__7529)
                                    }
                                  }else {
                                    var q__7531 = cljs.core._first.call(null, args__7530);
                                    var args__7532 = cljs.core._rest.call(null, args__7530);
                                    if(argc === 17) {
                                      if(f__7509.cljs$lang$arity$17) {
                                        return f__7509.cljs$lang$arity$17(a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511, h__7513, i__7515, j__7517, k__7519, l__7521, m__7523, n__7525, o__7527, p__7529, q__7531)
                                      }else {
                                        return f__7509.call(null, a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511, h__7513, i__7515, j__7517, k__7519, l__7521, m__7523, n__7525, o__7527, p__7529, q__7531)
                                      }
                                    }else {
                                      var r__7533 = cljs.core._first.call(null, args__7532);
                                      var args__7534 = cljs.core._rest.call(null, args__7532);
                                      if(argc === 18) {
                                        if(f__7509.cljs$lang$arity$18) {
                                          return f__7509.cljs$lang$arity$18(a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511, h__7513, i__7515, j__7517, k__7519, l__7521, m__7523, n__7525, o__7527, p__7529, q__7531, r__7533)
                                        }else {
                                          return f__7509.call(null, a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511, h__7513, i__7515, j__7517, k__7519, l__7521, m__7523, n__7525, o__7527, p__7529, q__7531, r__7533)
                                        }
                                      }else {
                                        var s__7535 = cljs.core._first.call(null, args__7534);
                                        var args__7536 = cljs.core._rest.call(null, args__7534);
                                        if(argc === 19) {
                                          if(f__7509.cljs$lang$arity$19) {
                                            return f__7509.cljs$lang$arity$19(a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511, h__7513, i__7515, j__7517, k__7519, l__7521, m__7523, n__7525, o__7527, p__7529, q__7531, r__7533, s__7535)
                                          }else {
                                            return f__7509.call(null, a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511, h__7513, i__7515, j__7517, k__7519, l__7521, m__7523, n__7525, o__7527, p__7529, q__7531, r__7533, s__7535)
                                          }
                                        }else {
                                          var t__7537 = cljs.core._first.call(null, args__7536);
                                          var args__7538 = cljs.core._rest.call(null, args__7536);
                                          if(argc === 20) {
                                            if(f__7509.cljs$lang$arity$20) {
                                              return f__7509.cljs$lang$arity$20(a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511, h__7513, i__7515, j__7517, k__7519, l__7521, m__7523, n__7525, o__7527, p__7529, q__7531, r__7533, s__7535, t__7537)
                                            }else {
                                              return f__7509.call(null, a__7499, b__7501, c__7503, d__7505, e__7507, f__7509, g__7511, h__7513, i__7515, j__7517, k__7519, l__7521, m__7523, n__7525, o__7527, p__7529, q__7531, r__7533, s__7535, t__7537)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__7553 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7554 = cljs.core.bounded_count.call(null, args, fixed_arity__7553 + 1);
      if(bc__7554 <= fixed_arity__7553) {
        return cljs.core.apply_to.call(null, f, bc__7554, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__7555 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__7556 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7557 = cljs.core.bounded_count.call(null, arglist__7555, fixed_arity__7556 + 1);
      if(bc__7557 <= fixed_arity__7556) {
        return cljs.core.apply_to.call(null, f, bc__7557, arglist__7555)
      }else {
        return f.cljs$lang$applyTo(arglist__7555)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7555))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__7558 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__7559 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7560 = cljs.core.bounded_count.call(null, arglist__7558, fixed_arity__7559 + 1);
      if(bc__7560 <= fixed_arity__7559) {
        return cljs.core.apply_to.call(null, f, bc__7560, arglist__7558)
      }else {
        return f.cljs$lang$applyTo(arglist__7558)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7558))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__7561 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__7562 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7563 = cljs.core.bounded_count.call(null, arglist__7561, fixed_arity__7562 + 1);
      if(bc__7563 <= fixed_arity__7562) {
        return cljs.core.apply_to.call(null, f, bc__7563, arglist__7561)
      }else {
        return f.cljs$lang$applyTo(arglist__7561)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7561))
    }
  };
  var apply__6 = function() {
    var G__7567__delegate = function(f, a, b, c, d, args) {
      var arglist__7564 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__7565 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__7566 = cljs.core.bounded_count.call(null, arglist__7564, fixed_arity__7565 + 1);
        if(bc__7566 <= fixed_arity__7565) {
          return cljs.core.apply_to.call(null, f, bc__7566, arglist__7564)
        }else {
          return f.cljs$lang$applyTo(arglist__7564)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7564))
      }
    };
    var G__7567 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7567__delegate.call(this, f, a, b, c, d, args)
    };
    G__7567.cljs$lang$maxFixedArity = 5;
    G__7567.cljs$lang$applyTo = function(arglist__7568) {
      var f = cljs.core.first(arglist__7568);
      var a = cljs.core.first(cljs.core.next(arglist__7568));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7568)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7568))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7568)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7568)))));
      return G__7567__delegate(f, a, b, c, d, args)
    };
    G__7567.cljs$lang$arity$variadic = G__7567__delegate;
    return G__7567
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__7569) {
    var obj = cljs.core.first(arglist__7569);
    var f = cljs.core.first(cljs.core.next(arglist__7569));
    var args = cljs.core.rest(cljs.core.next(arglist__7569));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__7570__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__7570 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7570__delegate.call(this, x, y, more)
    };
    G__7570.cljs$lang$maxFixedArity = 2;
    G__7570.cljs$lang$applyTo = function(arglist__7571) {
      var x = cljs.core.first(arglist__7571);
      var y = cljs.core.first(cljs.core.next(arglist__7571));
      var more = cljs.core.rest(cljs.core.next(arglist__7571));
      return G__7570__delegate(x, y, more)
    };
    G__7570.cljs$lang$arity$variadic = G__7570__delegate;
    return G__7570
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__7572 = pred;
        var G__7573 = cljs.core.next.call(null, coll);
        pred = G__7572;
        coll = G__7573;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3824__auto____7575 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____7575)) {
        return or__3824__auto____7575
      }else {
        var G__7576 = pred;
        var G__7577 = cljs.core.next.call(null, coll);
        pred = G__7576;
        coll = G__7577;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__7578 = null;
    var G__7578__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__7578__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__7578__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__7578__3 = function() {
      var G__7579__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__7579 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__7579__delegate.call(this, x, y, zs)
      };
      G__7579.cljs$lang$maxFixedArity = 2;
      G__7579.cljs$lang$applyTo = function(arglist__7580) {
        var x = cljs.core.first(arglist__7580);
        var y = cljs.core.first(cljs.core.next(arglist__7580));
        var zs = cljs.core.rest(cljs.core.next(arglist__7580));
        return G__7579__delegate(x, y, zs)
      };
      G__7579.cljs$lang$arity$variadic = G__7579__delegate;
      return G__7579
    }();
    G__7578 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__7578__0.call(this);
        case 1:
          return G__7578__1.call(this, x);
        case 2:
          return G__7578__2.call(this, x, y);
        default:
          return G__7578__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__7578.cljs$lang$maxFixedArity = 2;
    G__7578.cljs$lang$applyTo = G__7578__3.cljs$lang$applyTo;
    return G__7578
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__7581__delegate = function(args) {
      return x
    };
    var G__7581 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7581__delegate.call(this, args)
    };
    G__7581.cljs$lang$maxFixedArity = 0;
    G__7581.cljs$lang$applyTo = function(arglist__7582) {
      var args = cljs.core.seq(arglist__7582);
      return G__7581__delegate(args)
    };
    G__7581.cljs$lang$arity$variadic = G__7581__delegate;
    return G__7581
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__7589 = null;
      var G__7589__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__7589__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__7589__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__7589__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__7589__4 = function() {
        var G__7590__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__7590 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7590__delegate.call(this, x, y, z, args)
        };
        G__7590.cljs$lang$maxFixedArity = 3;
        G__7590.cljs$lang$applyTo = function(arglist__7591) {
          var x = cljs.core.first(arglist__7591);
          var y = cljs.core.first(cljs.core.next(arglist__7591));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7591)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7591)));
          return G__7590__delegate(x, y, z, args)
        };
        G__7590.cljs$lang$arity$variadic = G__7590__delegate;
        return G__7590
      }();
      G__7589 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7589__0.call(this);
          case 1:
            return G__7589__1.call(this, x);
          case 2:
            return G__7589__2.call(this, x, y);
          case 3:
            return G__7589__3.call(this, x, y, z);
          default:
            return G__7589__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7589.cljs$lang$maxFixedArity = 3;
      G__7589.cljs$lang$applyTo = G__7589__4.cljs$lang$applyTo;
      return G__7589
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__7592 = null;
      var G__7592__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__7592__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__7592__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__7592__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__7592__4 = function() {
        var G__7593__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__7593 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7593__delegate.call(this, x, y, z, args)
        };
        G__7593.cljs$lang$maxFixedArity = 3;
        G__7593.cljs$lang$applyTo = function(arglist__7594) {
          var x = cljs.core.first(arglist__7594);
          var y = cljs.core.first(cljs.core.next(arglist__7594));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7594)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7594)));
          return G__7593__delegate(x, y, z, args)
        };
        G__7593.cljs$lang$arity$variadic = G__7593__delegate;
        return G__7593
      }();
      G__7592 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7592__0.call(this);
          case 1:
            return G__7592__1.call(this, x);
          case 2:
            return G__7592__2.call(this, x, y);
          case 3:
            return G__7592__3.call(this, x, y, z);
          default:
            return G__7592__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7592.cljs$lang$maxFixedArity = 3;
      G__7592.cljs$lang$applyTo = G__7592__4.cljs$lang$applyTo;
      return G__7592
    }()
  };
  var comp__4 = function() {
    var G__7595__delegate = function(f1, f2, f3, fs) {
      var fs__7586 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__7596__delegate = function(args) {
          var ret__7587 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__7586), args);
          var fs__7588 = cljs.core.next.call(null, fs__7586);
          while(true) {
            if(fs__7588) {
              var G__7597 = cljs.core.first.call(null, fs__7588).call(null, ret__7587);
              var G__7598 = cljs.core.next.call(null, fs__7588);
              ret__7587 = G__7597;
              fs__7588 = G__7598;
              continue
            }else {
              return ret__7587
            }
            break
          }
        };
        var G__7596 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7596__delegate.call(this, args)
        };
        G__7596.cljs$lang$maxFixedArity = 0;
        G__7596.cljs$lang$applyTo = function(arglist__7599) {
          var args = cljs.core.seq(arglist__7599);
          return G__7596__delegate(args)
        };
        G__7596.cljs$lang$arity$variadic = G__7596__delegate;
        return G__7596
      }()
    };
    var G__7595 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7595__delegate.call(this, f1, f2, f3, fs)
    };
    G__7595.cljs$lang$maxFixedArity = 3;
    G__7595.cljs$lang$applyTo = function(arglist__7600) {
      var f1 = cljs.core.first(arglist__7600);
      var f2 = cljs.core.first(cljs.core.next(arglist__7600));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7600)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7600)));
      return G__7595__delegate(f1, f2, f3, fs)
    };
    G__7595.cljs$lang$arity$variadic = G__7595__delegate;
    return G__7595
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__7601__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__7601 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7601__delegate.call(this, args)
      };
      G__7601.cljs$lang$maxFixedArity = 0;
      G__7601.cljs$lang$applyTo = function(arglist__7602) {
        var args = cljs.core.seq(arglist__7602);
        return G__7601__delegate(args)
      };
      G__7601.cljs$lang$arity$variadic = G__7601__delegate;
      return G__7601
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__7603__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__7603 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7603__delegate.call(this, args)
      };
      G__7603.cljs$lang$maxFixedArity = 0;
      G__7603.cljs$lang$applyTo = function(arglist__7604) {
        var args = cljs.core.seq(arglist__7604);
        return G__7603__delegate(args)
      };
      G__7603.cljs$lang$arity$variadic = G__7603__delegate;
      return G__7603
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__7605__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__7605 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7605__delegate.call(this, args)
      };
      G__7605.cljs$lang$maxFixedArity = 0;
      G__7605.cljs$lang$applyTo = function(arglist__7606) {
        var args = cljs.core.seq(arglist__7606);
        return G__7605__delegate(args)
      };
      G__7605.cljs$lang$arity$variadic = G__7605__delegate;
      return G__7605
    }()
  };
  var partial__5 = function() {
    var G__7607__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__7608__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__7608 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7608__delegate.call(this, args)
        };
        G__7608.cljs$lang$maxFixedArity = 0;
        G__7608.cljs$lang$applyTo = function(arglist__7609) {
          var args = cljs.core.seq(arglist__7609);
          return G__7608__delegate(args)
        };
        G__7608.cljs$lang$arity$variadic = G__7608__delegate;
        return G__7608
      }()
    };
    var G__7607 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7607__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__7607.cljs$lang$maxFixedArity = 4;
    G__7607.cljs$lang$applyTo = function(arglist__7610) {
      var f = cljs.core.first(arglist__7610);
      var arg1 = cljs.core.first(cljs.core.next(arglist__7610));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7610)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7610))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7610))));
      return G__7607__delegate(f, arg1, arg2, arg3, more)
    };
    G__7607.cljs$lang$arity$variadic = G__7607__delegate;
    return G__7607
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__7611 = null;
      var G__7611__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__7611__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__7611__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__7611__4 = function() {
        var G__7612__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__7612 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7612__delegate.call(this, a, b, c, ds)
        };
        G__7612.cljs$lang$maxFixedArity = 3;
        G__7612.cljs$lang$applyTo = function(arglist__7613) {
          var a = cljs.core.first(arglist__7613);
          var b = cljs.core.first(cljs.core.next(arglist__7613));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7613)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7613)));
          return G__7612__delegate(a, b, c, ds)
        };
        G__7612.cljs$lang$arity$variadic = G__7612__delegate;
        return G__7612
      }();
      G__7611 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__7611__1.call(this, a);
          case 2:
            return G__7611__2.call(this, a, b);
          case 3:
            return G__7611__3.call(this, a, b, c);
          default:
            return G__7611__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7611.cljs$lang$maxFixedArity = 3;
      G__7611.cljs$lang$applyTo = G__7611__4.cljs$lang$applyTo;
      return G__7611
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__7614 = null;
      var G__7614__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7614__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__7614__4 = function() {
        var G__7615__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__7615 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7615__delegate.call(this, a, b, c, ds)
        };
        G__7615.cljs$lang$maxFixedArity = 3;
        G__7615.cljs$lang$applyTo = function(arglist__7616) {
          var a = cljs.core.first(arglist__7616);
          var b = cljs.core.first(cljs.core.next(arglist__7616));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7616)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7616)));
          return G__7615__delegate(a, b, c, ds)
        };
        G__7615.cljs$lang$arity$variadic = G__7615__delegate;
        return G__7615
      }();
      G__7614 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7614__2.call(this, a, b);
          case 3:
            return G__7614__3.call(this, a, b, c);
          default:
            return G__7614__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7614.cljs$lang$maxFixedArity = 3;
      G__7614.cljs$lang$applyTo = G__7614__4.cljs$lang$applyTo;
      return G__7614
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__7617 = null;
      var G__7617__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7617__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__7617__4 = function() {
        var G__7618__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__7618 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7618__delegate.call(this, a, b, c, ds)
        };
        G__7618.cljs$lang$maxFixedArity = 3;
        G__7618.cljs$lang$applyTo = function(arglist__7619) {
          var a = cljs.core.first(arglist__7619);
          var b = cljs.core.first(cljs.core.next(arglist__7619));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7619)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7619)));
          return G__7618__delegate(a, b, c, ds)
        };
        G__7618.cljs$lang$arity$variadic = G__7618__delegate;
        return G__7618
      }();
      G__7617 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7617__2.call(this, a, b);
          case 3:
            return G__7617__3.call(this, a, b, c);
          default:
            return G__7617__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7617.cljs$lang$maxFixedArity = 3;
      G__7617.cljs$lang$applyTo = G__7617__4.cljs$lang$applyTo;
      return G__7617
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__7635 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7643 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____7643) {
        var s__7644 = temp__3974__auto____7643;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7644)) {
          var c__7645 = cljs.core.chunk_first.call(null, s__7644);
          var size__7646 = cljs.core.count.call(null, c__7645);
          var b__7647 = cljs.core.chunk_buffer.call(null, size__7646);
          var n__2551__auto____7648 = size__7646;
          var i__7649 = 0;
          while(true) {
            if(i__7649 < n__2551__auto____7648) {
              cljs.core.chunk_append.call(null, b__7647, f.call(null, idx + i__7649, cljs.core._nth.call(null, c__7645, i__7649)));
              var G__7650 = i__7649 + 1;
              i__7649 = G__7650;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7647), mapi.call(null, idx + size__7646, cljs.core.chunk_rest.call(null, s__7644)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__7644)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__7644)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__7635.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____7660 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____7660) {
      var s__7661 = temp__3974__auto____7660;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__7661)) {
        var c__7662 = cljs.core.chunk_first.call(null, s__7661);
        var size__7663 = cljs.core.count.call(null, c__7662);
        var b__7664 = cljs.core.chunk_buffer.call(null, size__7663);
        var n__2551__auto____7665 = size__7663;
        var i__7666 = 0;
        while(true) {
          if(i__7666 < n__2551__auto____7665) {
            var x__7667 = f.call(null, cljs.core._nth.call(null, c__7662, i__7666));
            if(x__7667 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__7664, x__7667)
            }
            var G__7669 = i__7666 + 1;
            i__7666 = G__7669;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7664), keep.call(null, f, cljs.core.chunk_rest.call(null, s__7661)))
      }else {
        var x__7668 = f.call(null, cljs.core.first.call(null, s__7661));
        if(x__7668 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__7661))
        }else {
          return cljs.core.cons.call(null, x__7668, keep.call(null, f, cljs.core.rest.call(null, s__7661)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__7695 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7705 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____7705) {
        var s__7706 = temp__3974__auto____7705;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7706)) {
          var c__7707 = cljs.core.chunk_first.call(null, s__7706);
          var size__7708 = cljs.core.count.call(null, c__7707);
          var b__7709 = cljs.core.chunk_buffer.call(null, size__7708);
          var n__2551__auto____7710 = size__7708;
          var i__7711 = 0;
          while(true) {
            if(i__7711 < n__2551__auto____7710) {
              var x__7712 = f.call(null, idx + i__7711, cljs.core._nth.call(null, c__7707, i__7711));
              if(x__7712 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__7709, x__7712)
              }
              var G__7714 = i__7711 + 1;
              i__7711 = G__7714;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7709), keepi.call(null, idx + size__7708, cljs.core.chunk_rest.call(null, s__7706)))
        }else {
          var x__7713 = f.call(null, idx, cljs.core.first.call(null, s__7706));
          if(x__7713 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7706))
          }else {
            return cljs.core.cons.call(null, x__7713, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7706)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__7695.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7800 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7800)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____7800
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7801 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7801)) {
            var and__3822__auto____7802 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7802)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____7802
            }
          }else {
            return and__3822__auto____7801
          }
        }())
      };
      var ep1__4 = function() {
        var G__7871__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7803 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7803)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____7803
            }
          }())
        };
        var G__7871 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7871__delegate.call(this, x, y, z, args)
        };
        G__7871.cljs$lang$maxFixedArity = 3;
        G__7871.cljs$lang$applyTo = function(arglist__7872) {
          var x = cljs.core.first(arglist__7872);
          var y = cljs.core.first(cljs.core.next(arglist__7872));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7872)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7872)));
          return G__7871__delegate(x, y, z, args)
        };
        G__7871.cljs$lang$arity$variadic = G__7871__delegate;
        return G__7871
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7815 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7815)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____7815
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7816 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7816)) {
            var and__3822__auto____7817 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7817)) {
              var and__3822__auto____7818 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7818)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____7818
              }
            }else {
              return and__3822__auto____7817
            }
          }else {
            return and__3822__auto____7816
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7819 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7819)) {
            var and__3822__auto____7820 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7820)) {
              var and__3822__auto____7821 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____7821)) {
                var and__3822__auto____7822 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____7822)) {
                  var and__3822__auto____7823 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7823)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____7823
                  }
                }else {
                  return and__3822__auto____7822
                }
              }else {
                return and__3822__auto____7821
              }
            }else {
              return and__3822__auto____7820
            }
          }else {
            return and__3822__auto____7819
          }
        }())
      };
      var ep2__4 = function() {
        var G__7873__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7824 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7824)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7670_SHARP_) {
                var and__3822__auto____7825 = p1.call(null, p1__7670_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7825)) {
                  return p2.call(null, p1__7670_SHARP_)
                }else {
                  return and__3822__auto____7825
                }
              }, args)
            }else {
              return and__3822__auto____7824
            }
          }())
        };
        var G__7873 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7873__delegate.call(this, x, y, z, args)
        };
        G__7873.cljs$lang$maxFixedArity = 3;
        G__7873.cljs$lang$applyTo = function(arglist__7874) {
          var x = cljs.core.first(arglist__7874);
          var y = cljs.core.first(cljs.core.next(arglist__7874));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7874)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7874)));
          return G__7873__delegate(x, y, z, args)
        };
        G__7873.cljs$lang$arity$variadic = G__7873__delegate;
        return G__7873
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7844 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7844)) {
            var and__3822__auto____7845 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7845)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____7845
            }
          }else {
            return and__3822__auto____7844
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7846 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7846)) {
            var and__3822__auto____7847 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7847)) {
              var and__3822__auto____7848 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7848)) {
                var and__3822__auto____7849 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7849)) {
                  var and__3822__auto____7850 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7850)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____7850
                  }
                }else {
                  return and__3822__auto____7849
                }
              }else {
                return and__3822__auto____7848
              }
            }else {
              return and__3822__auto____7847
            }
          }else {
            return and__3822__auto____7846
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7851 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7851)) {
            var and__3822__auto____7852 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7852)) {
              var and__3822__auto____7853 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7853)) {
                var and__3822__auto____7854 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7854)) {
                  var and__3822__auto____7855 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7855)) {
                    var and__3822__auto____7856 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____7856)) {
                      var and__3822__auto____7857 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____7857)) {
                        var and__3822__auto____7858 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____7858)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____7858
                        }
                      }else {
                        return and__3822__auto____7857
                      }
                    }else {
                      return and__3822__auto____7856
                    }
                  }else {
                    return and__3822__auto____7855
                  }
                }else {
                  return and__3822__auto____7854
                }
              }else {
                return and__3822__auto____7853
              }
            }else {
              return and__3822__auto____7852
            }
          }else {
            return and__3822__auto____7851
          }
        }())
      };
      var ep3__4 = function() {
        var G__7875__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7859 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7859)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7671_SHARP_) {
                var and__3822__auto____7860 = p1.call(null, p1__7671_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7860)) {
                  var and__3822__auto____7861 = p2.call(null, p1__7671_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____7861)) {
                    return p3.call(null, p1__7671_SHARP_)
                  }else {
                    return and__3822__auto____7861
                  }
                }else {
                  return and__3822__auto____7860
                }
              }, args)
            }else {
              return and__3822__auto____7859
            }
          }())
        };
        var G__7875 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7875__delegate.call(this, x, y, z, args)
        };
        G__7875.cljs$lang$maxFixedArity = 3;
        G__7875.cljs$lang$applyTo = function(arglist__7876) {
          var x = cljs.core.first(arglist__7876);
          var y = cljs.core.first(cljs.core.next(arglist__7876));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7876)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7876)));
          return G__7875__delegate(x, y, z, args)
        };
        G__7875.cljs$lang$arity$variadic = G__7875__delegate;
        return G__7875
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__7877__delegate = function(p1, p2, p3, ps) {
      var ps__7862 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__7672_SHARP_) {
            return p1__7672_SHARP_.call(null, x)
          }, ps__7862)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__7673_SHARP_) {
            var and__3822__auto____7867 = p1__7673_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7867)) {
              return p1__7673_SHARP_.call(null, y)
            }else {
              return and__3822__auto____7867
            }
          }, ps__7862)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__7674_SHARP_) {
            var and__3822__auto____7868 = p1__7674_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7868)) {
              var and__3822__auto____7869 = p1__7674_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____7869)) {
                return p1__7674_SHARP_.call(null, z)
              }else {
                return and__3822__auto____7869
              }
            }else {
              return and__3822__auto____7868
            }
          }, ps__7862)
        };
        var epn__4 = function() {
          var G__7878__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____7870 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____7870)) {
                return cljs.core.every_QMARK_.call(null, function(p1__7675_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__7675_SHARP_, args)
                }, ps__7862)
              }else {
                return and__3822__auto____7870
              }
            }())
          };
          var G__7878 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7878__delegate.call(this, x, y, z, args)
          };
          G__7878.cljs$lang$maxFixedArity = 3;
          G__7878.cljs$lang$applyTo = function(arglist__7879) {
            var x = cljs.core.first(arglist__7879);
            var y = cljs.core.first(cljs.core.next(arglist__7879));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7879)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7879)));
            return G__7878__delegate(x, y, z, args)
          };
          G__7878.cljs$lang$arity$variadic = G__7878__delegate;
          return G__7878
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__7877 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7877__delegate.call(this, p1, p2, p3, ps)
    };
    G__7877.cljs$lang$maxFixedArity = 3;
    G__7877.cljs$lang$applyTo = function(arglist__7880) {
      var p1 = cljs.core.first(arglist__7880);
      var p2 = cljs.core.first(cljs.core.next(arglist__7880));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7880)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7880)));
      return G__7877__delegate(p1, p2, p3, ps)
    };
    G__7877.cljs$lang$arity$variadic = G__7877__delegate;
    return G__7877
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____7961 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7961)) {
          return or__3824__auto____7961
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____7962 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7962)) {
          return or__3824__auto____7962
        }else {
          var or__3824__auto____7963 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7963)) {
            return or__3824__auto____7963
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__8032__delegate = function(x, y, z, args) {
          var or__3824__auto____7964 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____7964)) {
            return or__3824__auto____7964
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__8032 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8032__delegate.call(this, x, y, z, args)
        };
        G__8032.cljs$lang$maxFixedArity = 3;
        G__8032.cljs$lang$applyTo = function(arglist__8033) {
          var x = cljs.core.first(arglist__8033);
          var y = cljs.core.first(cljs.core.next(arglist__8033));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8033)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8033)));
          return G__8032__delegate(x, y, z, args)
        };
        G__8032.cljs$lang$arity$variadic = G__8032__delegate;
        return G__8032
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____7976 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7976)) {
          return or__3824__auto____7976
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____7977 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7977)) {
          return or__3824__auto____7977
        }else {
          var or__3824__auto____7978 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7978)) {
            return or__3824__auto____7978
          }else {
            var or__3824__auto____7979 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7979)) {
              return or__3824__auto____7979
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____7980 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7980)) {
          return or__3824__auto____7980
        }else {
          var or__3824__auto____7981 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7981)) {
            return or__3824__auto____7981
          }else {
            var or__3824__auto____7982 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____7982)) {
              return or__3824__auto____7982
            }else {
              var or__3824__auto____7983 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____7983)) {
                return or__3824__auto____7983
              }else {
                var or__3824__auto____7984 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7984)) {
                  return or__3824__auto____7984
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__8034__delegate = function(x, y, z, args) {
          var or__3824__auto____7985 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____7985)) {
            return or__3824__auto____7985
          }else {
            return cljs.core.some.call(null, function(p1__7715_SHARP_) {
              var or__3824__auto____7986 = p1.call(null, p1__7715_SHARP_);
              if(cljs.core.truth_(or__3824__auto____7986)) {
                return or__3824__auto____7986
              }else {
                return p2.call(null, p1__7715_SHARP_)
              }
            }, args)
          }
        };
        var G__8034 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8034__delegate.call(this, x, y, z, args)
        };
        G__8034.cljs$lang$maxFixedArity = 3;
        G__8034.cljs$lang$applyTo = function(arglist__8035) {
          var x = cljs.core.first(arglist__8035);
          var y = cljs.core.first(cljs.core.next(arglist__8035));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8035)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8035)));
          return G__8034__delegate(x, y, z, args)
        };
        G__8034.cljs$lang$arity$variadic = G__8034__delegate;
        return G__8034
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____8005 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8005)) {
          return or__3824__auto____8005
        }else {
          var or__3824__auto____8006 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8006)) {
            return or__3824__auto____8006
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____8007 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8007)) {
          return or__3824__auto____8007
        }else {
          var or__3824__auto____8008 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8008)) {
            return or__3824__auto____8008
          }else {
            var or__3824__auto____8009 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8009)) {
              return or__3824__auto____8009
            }else {
              var or__3824__auto____8010 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8010)) {
                return or__3824__auto____8010
              }else {
                var or__3824__auto____8011 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8011)) {
                  return or__3824__auto____8011
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____8012 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8012)) {
          return or__3824__auto____8012
        }else {
          var or__3824__auto____8013 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8013)) {
            return or__3824__auto____8013
          }else {
            var or__3824__auto____8014 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8014)) {
              return or__3824__auto____8014
            }else {
              var or__3824__auto____8015 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8015)) {
                return or__3824__auto____8015
              }else {
                var or__3824__auto____8016 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8016)) {
                  return or__3824__auto____8016
                }else {
                  var or__3824__auto____8017 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____8017)) {
                    return or__3824__auto____8017
                  }else {
                    var or__3824__auto____8018 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____8018)) {
                      return or__3824__auto____8018
                    }else {
                      var or__3824__auto____8019 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____8019)) {
                        return or__3824__auto____8019
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__8036__delegate = function(x, y, z, args) {
          var or__3824__auto____8020 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8020)) {
            return or__3824__auto____8020
          }else {
            return cljs.core.some.call(null, function(p1__7716_SHARP_) {
              var or__3824__auto____8021 = p1.call(null, p1__7716_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8021)) {
                return or__3824__auto____8021
              }else {
                var or__3824__auto____8022 = p2.call(null, p1__7716_SHARP_);
                if(cljs.core.truth_(or__3824__auto____8022)) {
                  return or__3824__auto____8022
                }else {
                  return p3.call(null, p1__7716_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__8036 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8036__delegate.call(this, x, y, z, args)
        };
        G__8036.cljs$lang$maxFixedArity = 3;
        G__8036.cljs$lang$applyTo = function(arglist__8037) {
          var x = cljs.core.first(arglist__8037);
          var y = cljs.core.first(cljs.core.next(arglist__8037));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8037)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8037)));
          return G__8036__delegate(x, y, z, args)
        };
        G__8036.cljs$lang$arity$variadic = G__8036__delegate;
        return G__8036
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__8038__delegate = function(p1, p2, p3, ps) {
      var ps__8023 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__7717_SHARP_) {
            return p1__7717_SHARP_.call(null, x)
          }, ps__8023)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__7718_SHARP_) {
            var or__3824__auto____8028 = p1__7718_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8028)) {
              return or__3824__auto____8028
            }else {
              return p1__7718_SHARP_.call(null, y)
            }
          }, ps__8023)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__7719_SHARP_) {
            var or__3824__auto____8029 = p1__7719_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8029)) {
              return or__3824__auto____8029
            }else {
              var or__3824__auto____8030 = p1__7719_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8030)) {
                return or__3824__auto____8030
              }else {
                return p1__7719_SHARP_.call(null, z)
              }
            }
          }, ps__8023)
        };
        var spn__4 = function() {
          var G__8039__delegate = function(x, y, z, args) {
            var or__3824__auto____8031 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____8031)) {
              return or__3824__auto____8031
            }else {
              return cljs.core.some.call(null, function(p1__7720_SHARP_) {
                return cljs.core.some.call(null, p1__7720_SHARP_, args)
              }, ps__8023)
            }
          };
          var G__8039 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8039__delegate.call(this, x, y, z, args)
          };
          G__8039.cljs$lang$maxFixedArity = 3;
          G__8039.cljs$lang$applyTo = function(arglist__8040) {
            var x = cljs.core.first(arglist__8040);
            var y = cljs.core.first(cljs.core.next(arglist__8040));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8040)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8040)));
            return G__8039__delegate(x, y, z, args)
          };
          G__8039.cljs$lang$arity$variadic = G__8039__delegate;
          return G__8039
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__8038 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8038__delegate.call(this, p1, p2, p3, ps)
    };
    G__8038.cljs$lang$maxFixedArity = 3;
    G__8038.cljs$lang$applyTo = function(arglist__8041) {
      var p1 = cljs.core.first(arglist__8041);
      var p2 = cljs.core.first(cljs.core.next(arglist__8041));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8041)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8041)));
      return G__8038__delegate(p1, p2, p3, ps)
    };
    G__8038.cljs$lang$arity$variadic = G__8038__delegate;
    return G__8038
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8060 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8060) {
        var s__8061 = temp__3974__auto____8060;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8061)) {
          var c__8062 = cljs.core.chunk_first.call(null, s__8061);
          var size__8063 = cljs.core.count.call(null, c__8062);
          var b__8064 = cljs.core.chunk_buffer.call(null, size__8063);
          var n__2551__auto____8065 = size__8063;
          var i__8066 = 0;
          while(true) {
            if(i__8066 < n__2551__auto____8065) {
              cljs.core.chunk_append.call(null, b__8064, f.call(null, cljs.core._nth.call(null, c__8062, i__8066)));
              var G__8078 = i__8066 + 1;
              i__8066 = G__8078;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8064), map.call(null, f, cljs.core.chunk_rest.call(null, s__8061)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__8061)), map.call(null, f, cljs.core.rest.call(null, s__8061)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8067 = cljs.core.seq.call(null, c1);
      var s2__8068 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8069 = s1__8067;
        if(and__3822__auto____8069) {
          return s2__8068
        }else {
          return and__3822__auto____8069
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8067), cljs.core.first.call(null, s2__8068)), map.call(null, f, cljs.core.rest.call(null, s1__8067), cljs.core.rest.call(null, s2__8068)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8070 = cljs.core.seq.call(null, c1);
      var s2__8071 = cljs.core.seq.call(null, c2);
      var s3__8072 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____8073 = s1__8070;
        if(and__3822__auto____8073) {
          var and__3822__auto____8074 = s2__8071;
          if(and__3822__auto____8074) {
            return s3__8072
          }else {
            return and__3822__auto____8074
          }
        }else {
          return and__3822__auto____8073
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8070), cljs.core.first.call(null, s2__8071), cljs.core.first.call(null, s3__8072)), map.call(null, f, cljs.core.rest.call(null, s1__8070), cljs.core.rest.call(null, s2__8071), cljs.core.rest.call(null, s3__8072)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__8079__delegate = function(f, c1, c2, c3, colls) {
      var step__8077 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8076 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8076)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__8076), step.call(null, map.call(null, cljs.core.rest, ss__8076)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__7881_SHARP_) {
        return cljs.core.apply.call(null, f, p1__7881_SHARP_)
      }, step__8077.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__8079 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8079__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8079.cljs$lang$maxFixedArity = 4;
    G__8079.cljs$lang$applyTo = function(arglist__8080) {
      var f = cljs.core.first(arglist__8080);
      var c1 = cljs.core.first(cljs.core.next(arglist__8080));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8080)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8080))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8080))));
      return G__8079__delegate(f, c1, c2, c3, colls)
    };
    G__8079.cljs$lang$arity$variadic = G__8079__delegate;
    return G__8079
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____8083 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8083) {
        var s__8084 = temp__3974__auto____8083;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8084), take.call(null, n - 1, cljs.core.rest.call(null, s__8084)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8090 = function(n, coll) {
    while(true) {
      var s__8088 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8089 = n > 0;
        if(and__3822__auto____8089) {
          return s__8088
        }else {
          return and__3822__auto____8089
        }
      }())) {
        var G__8091 = n - 1;
        var G__8092 = cljs.core.rest.call(null, s__8088);
        n = G__8091;
        coll = G__8092;
        continue
      }else {
        return s__8088
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8090.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__8095 = cljs.core.seq.call(null, coll);
  var lead__8096 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__8096) {
      var G__8097 = cljs.core.next.call(null, s__8095);
      var G__8098 = cljs.core.next.call(null, lead__8096);
      s__8095 = G__8097;
      lead__8096 = G__8098;
      continue
    }else {
      return s__8095
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8104 = function(pred, coll) {
    while(true) {
      var s__8102 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8103 = s__8102;
        if(and__3822__auto____8103) {
          return pred.call(null, cljs.core.first.call(null, s__8102))
        }else {
          return and__3822__auto____8103
        }
      }())) {
        var G__8105 = pred;
        var G__8106 = cljs.core.rest.call(null, s__8102);
        pred = G__8105;
        coll = G__8106;
        continue
      }else {
        return s__8102
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8104.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8109 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8109) {
      var s__8110 = temp__3974__auto____8109;
      return cljs.core.concat.call(null, s__8110, cycle.call(null, s__8110))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8115 = cljs.core.seq.call(null, c1);
      var s2__8116 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8117 = s1__8115;
        if(and__3822__auto____8117) {
          return s2__8116
        }else {
          return and__3822__auto____8117
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__8115), cljs.core.cons.call(null, cljs.core.first.call(null, s2__8116), interleave.call(null, cljs.core.rest.call(null, s1__8115), cljs.core.rest.call(null, s2__8116))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8119__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8118 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8118)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__8118), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__8118)))
        }else {
          return null
        }
      }, null)
    };
    var G__8119 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8119__delegate.call(this, c1, c2, colls)
    };
    G__8119.cljs$lang$maxFixedArity = 2;
    G__8119.cljs$lang$applyTo = function(arglist__8120) {
      var c1 = cljs.core.first(arglist__8120);
      var c2 = cljs.core.first(cljs.core.next(arglist__8120));
      var colls = cljs.core.rest(cljs.core.next(arglist__8120));
      return G__8119__delegate(c1, c2, colls)
    };
    G__8119.cljs$lang$arity$variadic = G__8119__delegate;
    return G__8119
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__8130 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____8128 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____8128) {
        var coll__8129 = temp__3971__auto____8128;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__8129), cat.call(null, cljs.core.rest.call(null, coll__8129), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8130.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__8131__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__8131 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8131__delegate.call(this, f, coll, colls)
    };
    G__8131.cljs$lang$maxFixedArity = 2;
    G__8131.cljs$lang$applyTo = function(arglist__8132) {
      var f = cljs.core.first(arglist__8132);
      var coll = cljs.core.first(cljs.core.next(arglist__8132));
      var colls = cljs.core.rest(cljs.core.next(arglist__8132));
      return G__8131__delegate(f, coll, colls)
    };
    G__8131.cljs$lang$arity$variadic = G__8131__delegate;
    return G__8131
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8142 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8142) {
      var s__8143 = temp__3974__auto____8142;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8143)) {
        var c__8144 = cljs.core.chunk_first.call(null, s__8143);
        var size__8145 = cljs.core.count.call(null, c__8144);
        var b__8146 = cljs.core.chunk_buffer.call(null, size__8145);
        var n__2551__auto____8147 = size__8145;
        var i__8148 = 0;
        while(true) {
          if(i__8148 < n__2551__auto____8147) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__8144, i__8148)))) {
              cljs.core.chunk_append.call(null, b__8146, cljs.core._nth.call(null, c__8144, i__8148))
            }else {
            }
            var G__8151 = i__8148 + 1;
            i__8148 = G__8151;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8146), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__8143)))
      }else {
        var f__8149 = cljs.core.first.call(null, s__8143);
        var r__8150 = cljs.core.rest.call(null, s__8143);
        if(cljs.core.truth_(pred.call(null, f__8149))) {
          return cljs.core.cons.call(null, f__8149, filter.call(null, pred, r__8150))
        }else {
          return filter.call(null, pred, r__8150)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__8154 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__8154.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__8152_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__8152_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__8158__8159 = to;
    if(G__8158__8159) {
      if(function() {
        var or__3824__auto____8160 = G__8158__8159.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____8160) {
          return or__3824__auto____8160
        }else {
          return G__8158__8159.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__8158__8159.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8158__8159)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8158__8159)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__8161__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__8161 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8161__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8161.cljs$lang$maxFixedArity = 4;
    G__8161.cljs$lang$applyTo = function(arglist__8162) {
      var f = cljs.core.first(arglist__8162);
      var c1 = cljs.core.first(cljs.core.next(arglist__8162));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8162)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8162))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8162))));
      return G__8161__delegate(f, c1, c2, c3, colls)
    };
    G__8161.cljs$lang$arity$variadic = G__8161__delegate;
    return G__8161
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8169 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8169) {
        var s__8170 = temp__3974__auto____8169;
        var p__8171 = cljs.core.take.call(null, n, s__8170);
        if(n === cljs.core.count.call(null, p__8171)) {
          return cljs.core.cons.call(null, p__8171, partition.call(null, n, step, cljs.core.drop.call(null, step, s__8170)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8172 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8172) {
        var s__8173 = temp__3974__auto____8172;
        var p__8174 = cljs.core.take.call(null, n, s__8173);
        if(n === cljs.core.count.call(null, p__8174)) {
          return cljs.core.cons.call(null, p__8174, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__8173)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__8174, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__8179 = cljs.core.lookup_sentinel;
    var m__8180 = m;
    var ks__8181 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__8181) {
        var m__8182 = cljs.core._lookup.call(null, m__8180, cljs.core.first.call(null, ks__8181), sentinel__8179);
        if(sentinel__8179 === m__8182) {
          return not_found
        }else {
          var G__8183 = sentinel__8179;
          var G__8184 = m__8182;
          var G__8185 = cljs.core.next.call(null, ks__8181);
          sentinel__8179 = G__8183;
          m__8180 = G__8184;
          ks__8181 = G__8185;
          continue
        }
      }else {
        return m__8180
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__8186, v) {
  var vec__8191__8192 = p__8186;
  var k__8193 = cljs.core.nth.call(null, vec__8191__8192, 0, null);
  var ks__8194 = cljs.core.nthnext.call(null, vec__8191__8192, 1);
  if(cljs.core.truth_(ks__8194)) {
    return cljs.core.assoc.call(null, m, k__8193, assoc_in.call(null, cljs.core._lookup.call(null, m, k__8193, null), ks__8194, v))
  }else {
    return cljs.core.assoc.call(null, m, k__8193, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__8195, f, args) {
    var vec__8200__8201 = p__8195;
    var k__8202 = cljs.core.nth.call(null, vec__8200__8201, 0, null);
    var ks__8203 = cljs.core.nthnext.call(null, vec__8200__8201, 1);
    if(cljs.core.truth_(ks__8203)) {
      return cljs.core.assoc.call(null, m, k__8202, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__8202, null), ks__8203, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__8202, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__8202, null), args))
    }
  };
  var update_in = function(m, p__8195, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__8195, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__8204) {
    var m = cljs.core.first(arglist__8204);
    var p__8195 = cljs.core.first(cljs.core.next(arglist__8204));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8204)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8204)));
    return update_in__delegate(m, p__8195, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8207 = this;
  var h__2216__auto____8208 = this__8207.__hash;
  if(!(h__2216__auto____8208 == null)) {
    return h__2216__auto____8208
  }else {
    var h__2216__auto____8209 = cljs.core.hash_coll.call(null, coll);
    this__8207.__hash = h__2216__auto____8209;
    return h__2216__auto____8209
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8210 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8211 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8212 = this;
  var new_array__8213 = this__8212.array.slice();
  new_array__8213[k] = v;
  return new cljs.core.Vector(this__8212.meta, new_array__8213, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__8244 = null;
  var G__8244__2 = function(this_sym8214, k) {
    var this__8216 = this;
    var this_sym8214__8217 = this;
    var coll__8218 = this_sym8214__8217;
    return coll__8218.cljs$core$ILookup$_lookup$arity$2(coll__8218, k)
  };
  var G__8244__3 = function(this_sym8215, k, not_found) {
    var this__8216 = this;
    var this_sym8215__8219 = this;
    var coll__8220 = this_sym8215__8219;
    return coll__8220.cljs$core$ILookup$_lookup$arity$3(coll__8220, k, not_found)
  };
  G__8244 = function(this_sym8215, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8244__2.call(this, this_sym8215, k);
      case 3:
        return G__8244__3.call(this, this_sym8215, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8244
}();
cljs.core.Vector.prototype.apply = function(this_sym8205, args8206) {
  var this__8221 = this;
  return this_sym8205.call.apply(this_sym8205, [this_sym8205].concat(args8206.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8222 = this;
  var new_array__8223 = this__8222.array.slice();
  new_array__8223.push(o);
  return new cljs.core.Vector(this__8222.meta, new_array__8223, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__8224 = this;
  var this__8225 = this;
  return cljs.core.pr_str.call(null, this__8225)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8226 = this;
  return cljs.core.ci_reduce.call(null, this__8226.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8227 = this;
  return cljs.core.ci_reduce.call(null, this__8227.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8228 = this;
  if(this__8228.array.length > 0) {
    var vector_seq__8229 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__8228.array.length) {
          return cljs.core.cons.call(null, this__8228.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__8229.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8230 = this;
  return this__8230.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8231 = this;
  var count__8232 = this__8231.array.length;
  if(count__8232 > 0) {
    return this__8231.array[count__8232 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8233 = this;
  if(this__8233.array.length > 0) {
    var new_array__8234 = this__8233.array.slice();
    new_array__8234.pop();
    return new cljs.core.Vector(this__8233.meta, new_array__8234, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8235 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8236 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8237 = this;
  return new cljs.core.Vector(meta, this__8237.array, this__8237.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8238 = this;
  return this__8238.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8239 = this;
  if(function() {
    var and__3822__auto____8240 = 0 <= n;
    if(and__3822__auto____8240) {
      return n < this__8239.array.length
    }else {
      return and__3822__auto____8240
    }
  }()) {
    return this__8239.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8241 = this;
  if(function() {
    var and__3822__auto____8242 = 0 <= n;
    if(and__3822__auto____8242) {
      return n < this__8241.array.length
    }else {
      return and__3822__auto____8242
    }
  }()) {
    return this__8241.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8243 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8243.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2334__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__8246 = pv.cnt;
  if(cnt__8246 < 32) {
    return 0
  }else {
    return cnt__8246 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__8252 = level;
  var ret__8253 = node;
  while(true) {
    if(ll__8252 === 0) {
      return ret__8253
    }else {
      var embed__8254 = ret__8253;
      var r__8255 = cljs.core.pv_fresh_node.call(null, edit);
      var ___8256 = cljs.core.pv_aset.call(null, r__8255, 0, embed__8254);
      var G__8257 = ll__8252 - 5;
      var G__8258 = r__8255;
      ll__8252 = G__8257;
      ret__8253 = G__8258;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__8264 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__8265 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__8264, subidx__8265, tailnode);
    return ret__8264
  }else {
    var child__8266 = cljs.core.pv_aget.call(null, parent, subidx__8265);
    if(!(child__8266 == null)) {
      var node_to_insert__8267 = push_tail.call(null, pv, level - 5, child__8266, tailnode);
      cljs.core.pv_aset.call(null, ret__8264, subidx__8265, node_to_insert__8267);
      return ret__8264
    }else {
      var node_to_insert__8268 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__8264, subidx__8265, node_to_insert__8268);
      return ret__8264
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____8272 = 0 <= i;
    if(and__3822__auto____8272) {
      return i < pv.cnt
    }else {
      return and__3822__auto____8272
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__8273 = pv.root;
      var level__8274 = pv.shift;
      while(true) {
        if(level__8274 > 0) {
          var G__8275 = cljs.core.pv_aget.call(null, node__8273, i >>> level__8274 & 31);
          var G__8276 = level__8274 - 5;
          node__8273 = G__8275;
          level__8274 = G__8276;
          continue
        }else {
          return node__8273.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__8279 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__8279, i & 31, val);
    return ret__8279
  }else {
    var subidx__8280 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__8279, subidx__8280, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8280), i, val));
    return ret__8279
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__8286 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8287 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8286));
    if(function() {
      var and__3822__auto____8288 = new_child__8287 == null;
      if(and__3822__auto____8288) {
        return subidx__8286 === 0
      }else {
        return and__3822__auto____8288
      }
    }()) {
      return null
    }else {
      var ret__8289 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__8289, subidx__8286, new_child__8287);
      return ret__8289
    }
  }else {
    if(subidx__8286 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__8290 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__8290, subidx__8286, null);
        return ret__8290
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8293 = this;
  return new cljs.core.TransientVector(this__8293.cnt, this__8293.shift, cljs.core.tv_editable_root.call(null, this__8293.root), cljs.core.tv_editable_tail.call(null, this__8293.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8294 = this;
  var h__2216__auto____8295 = this__8294.__hash;
  if(!(h__2216__auto____8295 == null)) {
    return h__2216__auto____8295
  }else {
    var h__2216__auto____8296 = cljs.core.hash_coll.call(null, coll);
    this__8294.__hash = h__2216__auto____8296;
    return h__2216__auto____8296
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8297 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8298 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8299 = this;
  if(function() {
    var and__3822__auto____8300 = 0 <= k;
    if(and__3822__auto____8300) {
      return k < this__8299.cnt
    }else {
      return and__3822__auto____8300
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__8301 = this__8299.tail.slice();
      new_tail__8301[k & 31] = v;
      return new cljs.core.PersistentVector(this__8299.meta, this__8299.cnt, this__8299.shift, this__8299.root, new_tail__8301, null)
    }else {
      return new cljs.core.PersistentVector(this__8299.meta, this__8299.cnt, this__8299.shift, cljs.core.do_assoc.call(null, coll, this__8299.shift, this__8299.root, k, v), this__8299.tail, null)
    }
  }else {
    if(k === this__8299.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__8299.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__8349 = null;
  var G__8349__2 = function(this_sym8302, k) {
    var this__8304 = this;
    var this_sym8302__8305 = this;
    var coll__8306 = this_sym8302__8305;
    return coll__8306.cljs$core$ILookup$_lookup$arity$2(coll__8306, k)
  };
  var G__8349__3 = function(this_sym8303, k, not_found) {
    var this__8304 = this;
    var this_sym8303__8307 = this;
    var coll__8308 = this_sym8303__8307;
    return coll__8308.cljs$core$ILookup$_lookup$arity$3(coll__8308, k, not_found)
  };
  G__8349 = function(this_sym8303, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8349__2.call(this, this_sym8303, k);
      case 3:
        return G__8349__3.call(this, this_sym8303, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8349
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym8291, args8292) {
  var this__8309 = this;
  return this_sym8291.call.apply(this_sym8291, [this_sym8291].concat(args8292.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__8310 = this;
  var step_init__8311 = [0, init];
  var i__8312 = 0;
  while(true) {
    if(i__8312 < this__8310.cnt) {
      var arr__8313 = cljs.core.array_for.call(null, v, i__8312);
      var len__8314 = arr__8313.length;
      var init__8318 = function() {
        var j__8315 = 0;
        var init__8316 = step_init__8311[1];
        while(true) {
          if(j__8315 < len__8314) {
            var init__8317 = f.call(null, init__8316, j__8315 + i__8312, arr__8313[j__8315]);
            if(cljs.core.reduced_QMARK_.call(null, init__8317)) {
              return init__8317
            }else {
              var G__8350 = j__8315 + 1;
              var G__8351 = init__8317;
              j__8315 = G__8350;
              init__8316 = G__8351;
              continue
            }
          }else {
            step_init__8311[0] = len__8314;
            step_init__8311[1] = init__8316;
            return init__8316
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8318)) {
        return cljs.core.deref.call(null, init__8318)
      }else {
        var G__8352 = i__8312 + step_init__8311[0];
        i__8312 = G__8352;
        continue
      }
    }else {
      return step_init__8311[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8319 = this;
  if(this__8319.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__8320 = this__8319.tail.slice();
    new_tail__8320.push(o);
    return new cljs.core.PersistentVector(this__8319.meta, this__8319.cnt + 1, this__8319.shift, this__8319.root, new_tail__8320, null)
  }else {
    var root_overflow_QMARK___8321 = this__8319.cnt >>> 5 > 1 << this__8319.shift;
    var new_shift__8322 = root_overflow_QMARK___8321 ? this__8319.shift + 5 : this__8319.shift;
    var new_root__8324 = root_overflow_QMARK___8321 ? function() {
      var n_r__8323 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__8323, 0, this__8319.root);
      cljs.core.pv_aset.call(null, n_r__8323, 1, cljs.core.new_path.call(null, null, this__8319.shift, new cljs.core.VectorNode(null, this__8319.tail)));
      return n_r__8323
    }() : cljs.core.push_tail.call(null, coll, this__8319.shift, this__8319.root, new cljs.core.VectorNode(null, this__8319.tail));
    return new cljs.core.PersistentVector(this__8319.meta, this__8319.cnt + 1, new_shift__8322, new_root__8324, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8325 = this;
  if(this__8325.cnt > 0) {
    return new cljs.core.RSeq(coll, this__8325.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__8326 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__8327 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__8328 = this;
  var this__8329 = this;
  return cljs.core.pr_str.call(null, this__8329)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8330 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8331 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8332 = this;
  if(this__8332.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8333 = this;
  return this__8333.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8334 = this;
  if(this__8334.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__8334.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8335 = this;
  if(this__8335.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__8335.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8335.meta)
    }else {
      if(1 < this__8335.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__8335.meta, this__8335.cnt - 1, this__8335.shift, this__8335.root, this__8335.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__8336 = cljs.core.array_for.call(null, coll, this__8335.cnt - 2);
          var nr__8337 = cljs.core.pop_tail.call(null, coll, this__8335.shift, this__8335.root);
          var new_root__8338 = nr__8337 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__8337;
          var cnt_1__8339 = this__8335.cnt - 1;
          if(function() {
            var and__3822__auto____8340 = 5 < this__8335.shift;
            if(and__3822__auto____8340) {
              return cljs.core.pv_aget.call(null, new_root__8338, 1) == null
            }else {
              return and__3822__auto____8340
            }
          }()) {
            return new cljs.core.PersistentVector(this__8335.meta, cnt_1__8339, this__8335.shift - 5, cljs.core.pv_aget.call(null, new_root__8338, 0), new_tail__8336, null)
          }else {
            return new cljs.core.PersistentVector(this__8335.meta, cnt_1__8339, this__8335.shift, new_root__8338, new_tail__8336, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8341 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8342 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8343 = this;
  return new cljs.core.PersistentVector(meta, this__8343.cnt, this__8343.shift, this__8343.root, this__8343.tail, this__8343.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8344 = this;
  return this__8344.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8345 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8346 = this;
  if(function() {
    var and__3822__auto____8347 = 0 <= n;
    if(and__3822__auto____8347) {
      return n < this__8346.cnt
    }else {
      return and__3822__auto____8347
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8348 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8348.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__8353 = xs.length;
  var xs__8354 = no_clone === true ? xs : xs.slice();
  if(l__8353 < 32) {
    return new cljs.core.PersistentVector(null, l__8353, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__8354, null)
  }else {
    var node__8355 = xs__8354.slice(0, 32);
    var v__8356 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__8355, null);
    var i__8357 = 32;
    var out__8358 = cljs.core._as_transient.call(null, v__8356);
    while(true) {
      if(i__8357 < l__8353) {
        var G__8359 = i__8357 + 1;
        var G__8360 = cljs.core.conj_BANG_.call(null, out__8358, xs__8354[i__8357]);
        i__8357 = G__8359;
        out__8358 = G__8360;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__8358)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__8361) {
    var args = cljs.core.seq(arglist__8361);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8362 = this;
  if(this__8362.off + 1 < this__8362.node.length) {
    var s__8363 = cljs.core.chunked_seq.call(null, this__8362.vec, this__8362.node, this__8362.i, this__8362.off + 1);
    if(s__8363 == null) {
      return null
    }else {
      return s__8363
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8364 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8365 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8366 = this;
  return this__8366.node[this__8366.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8367 = this;
  if(this__8367.off + 1 < this__8367.node.length) {
    var s__8368 = cljs.core.chunked_seq.call(null, this__8367.vec, this__8367.node, this__8367.i, this__8367.off + 1);
    if(s__8368 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__8368
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8369 = this;
  var l__8370 = this__8369.node.length;
  var s__8371 = this__8369.i + l__8370 < cljs.core._count.call(null, this__8369.vec) ? cljs.core.chunked_seq.call(null, this__8369.vec, this__8369.i + l__8370, 0) : null;
  if(s__8371 == null) {
    return null
  }else {
    return s__8371
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8372 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8373 = this;
  return cljs.core.chunked_seq.call(null, this__8373.vec, this__8373.node, this__8373.i, this__8373.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__8374 = this;
  return this__8374.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8375 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8375.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8376 = this;
  return cljs.core.array_chunk.call(null, this__8376.node, this__8376.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8377 = this;
  var l__8378 = this__8377.node.length;
  var s__8379 = this__8377.i + l__8378 < cljs.core._count.call(null, this__8377.vec) ? cljs.core.chunked_seq.call(null, this__8377.vec, this__8377.i + l__8378, 0) : null;
  if(s__8379 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__8379
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8382 = this;
  var h__2216__auto____8383 = this__8382.__hash;
  if(!(h__2216__auto____8383 == null)) {
    return h__2216__auto____8383
  }else {
    var h__2216__auto____8384 = cljs.core.hash_coll.call(null, coll);
    this__8382.__hash = h__2216__auto____8384;
    return h__2216__auto____8384
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8385 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8386 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__8387 = this;
  var v_pos__8388 = this__8387.start + key;
  return new cljs.core.Subvec(this__8387.meta, cljs.core._assoc.call(null, this__8387.v, v_pos__8388, val), this__8387.start, this__8387.end > v_pos__8388 + 1 ? this__8387.end : v_pos__8388 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__8414 = null;
  var G__8414__2 = function(this_sym8389, k) {
    var this__8391 = this;
    var this_sym8389__8392 = this;
    var coll__8393 = this_sym8389__8392;
    return coll__8393.cljs$core$ILookup$_lookup$arity$2(coll__8393, k)
  };
  var G__8414__3 = function(this_sym8390, k, not_found) {
    var this__8391 = this;
    var this_sym8390__8394 = this;
    var coll__8395 = this_sym8390__8394;
    return coll__8395.cljs$core$ILookup$_lookup$arity$3(coll__8395, k, not_found)
  };
  G__8414 = function(this_sym8390, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8414__2.call(this, this_sym8390, k);
      case 3:
        return G__8414__3.call(this, this_sym8390, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8414
}();
cljs.core.Subvec.prototype.apply = function(this_sym8380, args8381) {
  var this__8396 = this;
  return this_sym8380.call.apply(this_sym8380, [this_sym8380].concat(args8381.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8397 = this;
  return new cljs.core.Subvec(this__8397.meta, cljs.core._assoc_n.call(null, this__8397.v, this__8397.end, o), this__8397.start, this__8397.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__8398 = this;
  var this__8399 = this;
  return cljs.core.pr_str.call(null, this__8399)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8400 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8401 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8402 = this;
  var subvec_seq__8403 = function subvec_seq(i) {
    if(i === this__8402.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__8402.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__8403.call(null, this__8402.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8404 = this;
  return this__8404.end - this__8404.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8405 = this;
  return cljs.core._nth.call(null, this__8405.v, this__8405.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8406 = this;
  if(this__8406.start === this__8406.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__8406.meta, this__8406.v, this__8406.start, this__8406.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8407 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8408 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8409 = this;
  return new cljs.core.Subvec(meta, this__8409.v, this__8409.start, this__8409.end, this__8409.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8410 = this;
  return this__8410.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8411 = this;
  return cljs.core._nth.call(null, this__8411.v, this__8411.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8412 = this;
  return cljs.core._nth.call(null, this__8412.v, this__8412.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8413 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8413.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__8416 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__8416, 0, tl.length);
  return ret__8416
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__8420 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__8421 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__8420, subidx__8421, level === 5 ? tail_node : function() {
    var child__8422 = cljs.core.pv_aget.call(null, ret__8420, subidx__8421);
    if(!(child__8422 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__8422, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__8420
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__8427 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__8428 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8429 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__8427, subidx__8428));
    if(function() {
      var and__3822__auto____8430 = new_child__8429 == null;
      if(and__3822__auto____8430) {
        return subidx__8428 === 0
      }else {
        return and__3822__auto____8430
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__8427, subidx__8428, new_child__8429);
      return node__8427
    }
  }else {
    if(subidx__8428 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__8427, subidx__8428, null);
        return node__8427
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____8435 = 0 <= i;
    if(and__3822__auto____8435) {
      return i < tv.cnt
    }else {
      return and__3822__auto____8435
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__8436 = tv.root;
      var node__8437 = root__8436;
      var level__8438 = tv.shift;
      while(true) {
        if(level__8438 > 0) {
          var G__8439 = cljs.core.tv_ensure_editable.call(null, root__8436.edit, cljs.core.pv_aget.call(null, node__8437, i >>> level__8438 & 31));
          var G__8440 = level__8438 - 5;
          node__8437 = G__8439;
          level__8438 = G__8440;
          continue
        }else {
          return node__8437.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__8480 = null;
  var G__8480__2 = function(this_sym8443, k) {
    var this__8445 = this;
    var this_sym8443__8446 = this;
    var coll__8447 = this_sym8443__8446;
    return coll__8447.cljs$core$ILookup$_lookup$arity$2(coll__8447, k)
  };
  var G__8480__3 = function(this_sym8444, k, not_found) {
    var this__8445 = this;
    var this_sym8444__8448 = this;
    var coll__8449 = this_sym8444__8448;
    return coll__8449.cljs$core$ILookup$_lookup$arity$3(coll__8449, k, not_found)
  };
  G__8480 = function(this_sym8444, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8480__2.call(this, this_sym8444, k);
      case 3:
        return G__8480__3.call(this, this_sym8444, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8480
}();
cljs.core.TransientVector.prototype.apply = function(this_sym8441, args8442) {
  var this__8450 = this;
  return this_sym8441.call.apply(this_sym8441, [this_sym8441].concat(args8442.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8451 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8452 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8453 = this;
  if(this__8453.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8454 = this;
  if(function() {
    var and__3822__auto____8455 = 0 <= n;
    if(and__3822__auto____8455) {
      return n < this__8454.cnt
    }else {
      return and__3822__auto____8455
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8456 = this;
  if(this__8456.root.edit) {
    return this__8456.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__8457 = this;
  if(this__8457.root.edit) {
    if(function() {
      var and__3822__auto____8458 = 0 <= n;
      if(and__3822__auto____8458) {
        return n < this__8457.cnt
      }else {
        return and__3822__auto____8458
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__8457.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__8463 = function go(level, node) {
          var node__8461 = cljs.core.tv_ensure_editable.call(null, this__8457.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__8461, n & 31, val);
            return node__8461
          }else {
            var subidx__8462 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__8461, subidx__8462, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__8461, subidx__8462)));
            return node__8461
          }
        }.call(null, this__8457.shift, this__8457.root);
        this__8457.root = new_root__8463;
        return tcoll
      }
    }else {
      if(n === this__8457.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__8457.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__8464 = this;
  if(this__8464.root.edit) {
    if(this__8464.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__8464.cnt) {
        this__8464.cnt = 0;
        return tcoll
      }else {
        if((this__8464.cnt - 1 & 31) > 0) {
          this__8464.cnt = this__8464.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__8465 = cljs.core.editable_array_for.call(null, tcoll, this__8464.cnt - 2);
            var new_root__8467 = function() {
              var nr__8466 = cljs.core.tv_pop_tail.call(null, tcoll, this__8464.shift, this__8464.root);
              if(!(nr__8466 == null)) {
                return nr__8466
              }else {
                return new cljs.core.VectorNode(this__8464.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____8468 = 5 < this__8464.shift;
              if(and__3822__auto____8468) {
                return cljs.core.pv_aget.call(null, new_root__8467, 1) == null
              }else {
                return and__3822__auto____8468
              }
            }()) {
              var new_root__8469 = cljs.core.tv_ensure_editable.call(null, this__8464.root.edit, cljs.core.pv_aget.call(null, new_root__8467, 0));
              this__8464.root = new_root__8469;
              this__8464.shift = this__8464.shift - 5;
              this__8464.cnt = this__8464.cnt - 1;
              this__8464.tail = new_tail__8465;
              return tcoll
            }else {
              this__8464.root = new_root__8467;
              this__8464.cnt = this__8464.cnt - 1;
              this__8464.tail = new_tail__8465;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8470 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8471 = this;
  if(this__8471.root.edit) {
    if(this__8471.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__8471.tail[this__8471.cnt & 31] = o;
      this__8471.cnt = this__8471.cnt + 1;
      return tcoll
    }else {
      var tail_node__8472 = new cljs.core.VectorNode(this__8471.root.edit, this__8471.tail);
      var new_tail__8473 = cljs.core.make_array.call(null, 32);
      new_tail__8473[0] = o;
      this__8471.tail = new_tail__8473;
      if(this__8471.cnt >>> 5 > 1 << this__8471.shift) {
        var new_root_array__8474 = cljs.core.make_array.call(null, 32);
        var new_shift__8475 = this__8471.shift + 5;
        new_root_array__8474[0] = this__8471.root;
        new_root_array__8474[1] = cljs.core.new_path.call(null, this__8471.root.edit, this__8471.shift, tail_node__8472);
        this__8471.root = new cljs.core.VectorNode(this__8471.root.edit, new_root_array__8474);
        this__8471.shift = new_shift__8475;
        this__8471.cnt = this__8471.cnt + 1;
        return tcoll
      }else {
        var new_root__8476 = cljs.core.tv_push_tail.call(null, tcoll, this__8471.shift, this__8471.root, tail_node__8472);
        this__8471.root = new_root__8476;
        this__8471.cnt = this__8471.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8477 = this;
  if(this__8477.root.edit) {
    this__8477.root.edit = null;
    var len__8478 = this__8477.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__8479 = cljs.core.make_array.call(null, len__8478);
    cljs.core.array_copy.call(null, this__8477.tail, 0, trimmed_tail__8479, 0, len__8478);
    return new cljs.core.PersistentVector(null, this__8477.cnt, this__8477.shift, this__8477.root, trimmed_tail__8479, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8481 = this;
  var h__2216__auto____8482 = this__8481.__hash;
  if(!(h__2216__auto____8482 == null)) {
    return h__2216__auto____8482
  }else {
    var h__2216__auto____8483 = cljs.core.hash_coll.call(null, coll);
    this__8481.__hash = h__2216__auto____8483;
    return h__2216__auto____8483
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8484 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__8485 = this;
  var this__8486 = this;
  return cljs.core.pr_str.call(null, this__8486)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8487 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8488 = this;
  return cljs.core._first.call(null, this__8488.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8489 = this;
  var temp__3971__auto____8490 = cljs.core.next.call(null, this__8489.front);
  if(temp__3971__auto____8490) {
    var f1__8491 = temp__3971__auto____8490;
    return new cljs.core.PersistentQueueSeq(this__8489.meta, f1__8491, this__8489.rear, null)
  }else {
    if(this__8489.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8489.meta, this__8489.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8492 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8493 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8493.front, this__8493.rear, this__8493.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8494 = this;
  return this__8494.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8495 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8495.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8496 = this;
  var h__2216__auto____8497 = this__8496.__hash;
  if(!(h__2216__auto____8497 == null)) {
    return h__2216__auto____8497
  }else {
    var h__2216__auto____8498 = cljs.core.hash_coll.call(null, coll);
    this__8496.__hash = h__2216__auto____8498;
    return h__2216__auto____8498
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8499 = this;
  if(cljs.core.truth_(this__8499.front)) {
    return new cljs.core.PersistentQueue(this__8499.meta, this__8499.count + 1, this__8499.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____8500 = this__8499.rear;
      if(cljs.core.truth_(or__3824__auto____8500)) {
        return or__3824__auto____8500
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__8499.meta, this__8499.count + 1, cljs.core.conj.call(null, this__8499.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__8501 = this;
  var this__8502 = this;
  return cljs.core.pr_str.call(null, this__8502)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8503 = this;
  var rear__8504 = cljs.core.seq.call(null, this__8503.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____8505 = this__8503.front;
    if(cljs.core.truth_(or__3824__auto____8505)) {
      return or__3824__auto____8505
    }else {
      return rear__8504
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8503.front, cljs.core.seq.call(null, rear__8504), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8506 = this;
  return this__8506.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8507 = this;
  return cljs.core._first.call(null, this__8507.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8508 = this;
  if(cljs.core.truth_(this__8508.front)) {
    var temp__3971__auto____8509 = cljs.core.next.call(null, this__8508.front);
    if(temp__3971__auto____8509) {
      var f1__8510 = temp__3971__auto____8509;
      return new cljs.core.PersistentQueue(this__8508.meta, this__8508.count - 1, f1__8510, this__8508.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__8508.meta, this__8508.count - 1, cljs.core.seq.call(null, this__8508.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8511 = this;
  return cljs.core.first.call(null, this__8511.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8512 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8513 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8514 = this;
  return new cljs.core.PersistentQueue(meta, this__8514.count, this__8514.front, this__8514.rear, this__8514.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8515 = this;
  return this__8515.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8516 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__8517 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__8520 = array.length;
  var i__8521 = 0;
  while(true) {
    if(i__8521 < len__8520) {
      if(k === array[i__8521]) {
        return i__8521
      }else {
        var G__8522 = i__8521 + incr;
        i__8521 = G__8522;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8525 = cljs.core.hash.call(null, a);
  var b__8526 = cljs.core.hash.call(null, b);
  if(a__8525 < b__8526) {
    return-1
  }else {
    if(a__8525 > b__8526) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__8534 = m.keys;
  var len__8535 = ks__8534.length;
  var so__8536 = m.strobj;
  var out__8537 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__8538 = 0;
  var out__8539 = cljs.core.transient$.call(null, out__8537);
  while(true) {
    if(i__8538 < len__8535) {
      var k__8540 = ks__8534[i__8538];
      var G__8541 = i__8538 + 1;
      var G__8542 = cljs.core.assoc_BANG_.call(null, out__8539, k__8540, so__8536[k__8540]);
      i__8538 = G__8541;
      out__8539 = G__8542;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__8539, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__8548 = {};
  var l__8549 = ks.length;
  var i__8550 = 0;
  while(true) {
    if(i__8550 < l__8549) {
      var k__8551 = ks[i__8550];
      new_obj__8548[k__8551] = obj[k__8551];
      var G__8552 = i__8550 + 1;
      i__8550 = G__8552;
      continue
    }else {
    }
    break
  }
  return new_obj__8548
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8555 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8556 = this;
  var h__2216__auto____8557 = this__8556.__hash;
  if(!(h__2216__auto____8557 == null)) {
    return h__2216__auto____8557
  }else {
    var h__2216__auto____8558 = cljs.core.hash_imap.call(null, coll);
    this__8556.__hash = h__2216__auto____8558;
    return h__2216__auto____8558
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8559 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8560 = this;
  if(function() {
    var and__3822__auto____8561 = goog.isString(k);
    if(and__3822__auto____8561) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8560.keys) == null)
    }else {
      return and__3822__auto____8561
    }
  }()) {
    return this__8560.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8562 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____8563 = this__8562.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____8563) {
        return or__3824__auto____8563
      }else {
        return this__8562.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__8562.keys) == null)) {
        var new_strobj__8564 = cljs.core.obj_clone.call(null, this__8562.strobj, this__8562.keys);
        new_strobj__8564[k] = v;
        return new cljs.core.ObjMap(this__8562.meta, this__8562.keys, new_strobj__8564, this__8562.update_count + 1, null)
      }else {
        var new_strobj__8565 = cljs.core.obj_clone.call(null, this__8562.strobj, this__8562.keys);
        var new_keys__8566 = this__8562.keys.slice();
        new_strobj__8565[k] = v;
        new_keys__8566.push(k);
        return new cljs.core.ObjMap(this__8562.meta, new_keys__8566, new_strobj__8565, this__8562.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8567 = this;
  if(function() {
    var and__3822__auto____8568 = goog.isString(k);
    if(and__3822__auto____8568) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8567.keys) == null)
    }else {
      return and__3822__auto____8568
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__8590 = null;
  var G__8590__2 = function(this_sym8569, k) {
    var this__8571 = this;
    var this_sym8569__8572 = this;
    var coll__8573 = this_sym8569__8572;
    return coll__8573.cljs$core$ILookup$_lookup$arity$2(coll__8573, k)
  };
  var G__8590__3 = function(this_sym8570, k, not_found) {
    var this__8571 = this;
    var this_sym8570__8574 = this;
    var coll__8575 = this_sym8570__8574;
    return coll__8575.cljs$core$ILookup$_lookup$arity$3(coll__8575, k, not_found)
  };
  G__8590 = function(this_sym8570, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8590__2.call(this, this_sym8570, k);
      case 3:
        return G__8590__3.call(this, this_sym8570, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8590
}();
cljs.core.ObjMap.prototype.apply = function(this_sym8553, args8554) {
  var this__8576 = this;
  return this_sym8553.call.apply(this_sym8553, [this_sym8553].concat(args8554.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8577 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__8578 = this;
  var this__8579 = this;
  return cljs.core.pr_str.call(null, this__8579)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8580 = this;
  if(this__8580.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__8543_SHARP_) {
      return cljs.core.vector.call(null, p1__8543_SHARP_, this__8580.strobj[p1__8543_SHARP_])
    }, this__8580.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8581 = this;
  return this__8581.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8582 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8583 = this;
  return new cljs.core.ObjMap(meta, this__8583.keys, this__8583.strobj, this__8583.update_count, this__8583.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8584 = this;
  return this__8584.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8585 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__8585.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8586 = this;
  if(function() {
    var and__3822__auto____8587 = goog.isString(k);
    if(and__3822__auto____8587) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8586.keys) == null)
    }else {
      return and__3822__auto____8587
    }
  }()) {
    var new_keys__8588 = this__8586.keys.slice();
    var new_strobj__8589 = cljs.core.obj_clone.call(null, this__8586.strobj, this__8586.keys);
    new_keys__8588.splice(cljs.core.scan_array.call(null, 1, k, new_keys__8588), 1);
    cljs.core.js_delete.call(null, new_strobj__8589, k);
    return new cljs.core.ObjMap(this__8586.meta, new_keys__8588, new_strobj__8589, this__8586.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8594 = this;
  var h__2216__auto____8595 = this__8594.__hash;
  if(!(h__2216__auto____8595 == null)) {
    return h__2216__auto____8595
  }else {
    var h__2216__auto____8596 = cljs.core.hash_imap.call(null, coll);
    this__8594.__hash = h__2216__auto____8596;
    return h__2216__auto____8596
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8597 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8598 = this;
  var bucket__8599 = this__8598.hashobj[cljs.core.hash.call(null, k)];
  var i__8600 = cljs.core.truth_(bucket__8599) ? cljs.core.scan_array.call(null, 2, k, bucket__8599) : null;
  if(cljs.core.truth_(i__8600)) {
    return bucket__8599[i__8600 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8601 = this;
  var h__8602 = cljs.core.hash.call(null, k);
  var bucket__8603 = this__8601.hashobj[h__8602];
  if(cljs.core.truth_(bucket__8603)) {
    var new_bucket__8604 = bucket__8603.slice();
    var new_hashobj__8605 = goog.object.clone(this__8601.hashobj);
    new_hashobj__8605[h__8602] = new_bucket__8604;
    var temp__3971__auto____8606 = cljs.core.scan_array.call(null, 2, k, new_bucket__8604);
    if(cljs.core.truth_(temp__3971__auto____8606)) {
      var i__8607 = temp__3971__auto____8606;
      new_bucket__8604[i__8607 + 1] = v;
      return new cljs.core.HashMap(this__8601.meta, this__8601.count, new_hashobj__8605, null)
    }else {
      new_bucket__8604.push(k, v);
      return new cljs.core.HashMap(this__8601.meta, this__8601.count + 1, new_hashobj__8605, null)
    }
  }else {
    var new_hashobj__8608 = goog.object.clone(this__8601.hashobj);
    new_hashobj__8608[h__8602] = [k, v];
    return new cljs.core.HashMap(this__8601.meta, this__8601.count + 1, new_hashobj__8608, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8609 = this;
  var bucket__8610 = this__8609.hashobj[cljs.core.hash.call(null, k)];
  var i__8611 = cljs.core.truth_(bucket__8610) ? cljs.core.scan_array.call(null, 2, k, bucket__8610) : null;
  if(cljs.core.truth_(i__8611)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__8636 = null;
  var G__8636__2 = function(this_sym8612, k) {
    var this__8614 = this;
    var this_sym8612__8615 = this;
    var coll__8616 = this_sym8612__8615;
    return coll__8616.cljs$core$ILookup$_lookup$arity$2(coll__8616, k)
  };
  var G__8636__3 = function(this_sym8613, k, not_found) {
    var this__8614 = this;
    var this_sym8613__8617 = this;
    var coll__8618 = this_sym8613__8617;
    return coll__8618.cljs$core$ILookup$_lookup$arity$3(coll__8618, k, not_found)
  };
  G__8636 = function(this_sym8613, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8636__2.call(this, this_sym8613, k);
      case 3:
        return G__8636__3.call(this, this_sym8613, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8636
}();
cljs.core.HashMap.prototype.apply = function(this_sym8592, args8593) {
  var this__8619 = this;
  return this_sym8592.call.apply(this_sym8592, [this_sym8592].concat(args8593.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8620 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__8621 = this;
  var this__8622 = this;
  return cljs.core.pr_str.call(null, this__8622)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8623 = this;
  if(this__8623.count > 0) {
    var hashes__8624 = cljs.core.js_keys.call(null, this__8623.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__8591_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__8623.hashobj[p1__8591_SHARP_]))
    }, hashes__8624)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8625 = this;
  return this__8625.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8626 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8627 = this;
  return new cljs.core.HashMap(meta, this__8627.count, this__8627.hashobj, this__8627.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8628 = this;
  return this__8628.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8629 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__8629.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8630 = this;
  var h__8631 = cljs.core.hash.call(null, k);
  var bucket__8632 = this__8630.hashobj[h__8631];
  var i__8633 = cljs.core.truth_(bucket__8632) ? cljs.core.scan_array.call(null, 2, k, bucket__8632) : null;
  if(cljs.core.not.call(null, i__8633)) {
    return coll
  }else {
    var new_hashobj__8634 = goog.object.clone(this__8630.hashobj);
    if(3 > bucket__8632.length) {
      cljs.core.js_delete.call(null, new_hashobj__8634, h__8631)
    }else {
      var new_bucket__8635 = bucket__8632.slice();
      new_bucket__8635.splice(i__8633, 2);
      new_hashobj__8634[h__8631] = new_bucket__8635
    }
    return new cljs.core.HashMap(this__8630.meta, this__8630.count - 1, new_hashobj__8634, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__8637 = ks.length;
  var i__8638 = 0;
  var out__8639 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__8638 < len__8637) {
      var G__8640 = i__8638 + 1;
      var G__8641 = cljs.core.assoc.call(null, out__8639, ks[i__8638], vs[i__8638]);
      i__8638 = G__8640;
      out__8639 = G__8641;
      continue
    }else {
      return out__8639
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__8645 = m.arr;
  var len__8646 = arr__8645.length;
  var i__8647 = 0;
  while(true) {
    if(len__8646 <= i__8647) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__8645[i__8647], k)) {
        return i__8647
      }else {
        if("\ufdd0'else") {
          var G__8648 = i__8647 + 2;
          i__8647 = G__8648;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8651 = this;
  return new cljs.core.TransientArrayMap({}, this__8651.arr.length, this__8651.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8652 = this;
  var h__2216__auto____8653 = this__8652.__hash;
  if(!(h__2216__auto____8653 == null)) {
    return h__2216__auto____8653
  }else {
    var h__2216__auto____8654 = cljs.core.hash_imap.call(null, coll);
    this__8652.__hash = h__2216__auto____8654;
    return h__2216__auto____8654
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8655 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8656 = this;
  var idx__8657 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8657 === -1) {
    return not_found
  }else {
    return this__8656.arr[idx__8657 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8658 = this;
  var idx__8659 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8659 === -1) {
    if(this__8658.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__8658.meta, this__8658.cnt + 1, function() {
        var G__8660__8661 = this__8658.arr.slice();
        G__8660__8661.push(k);
        G__8660__8661.push(v);
        return G__8660__8661
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__8658.arr[idx__8659 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__8658.meta, this__8658.cnt, function() {
          var G__8662__8663 = this__8658.arr.slice();
          G__8662__8663[idx__8659 + 1] = v;
          return G__8662__8663
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8664 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__8696 = null;
  var G__8696__2 = function(this_sym8665, k) {
    var this__8667 = this;
    var this_sym8665__8668 = this;
    var coll__8669 = this_sym8665__8668;
    return coll__8669.cljs$core$ILookup$_lookup$arity$2(coll__8669, k)
  };
  var G__8696__3 = function(this_sym8666, k, not_found) {
    var this__8667 = this;
    var this_sym8666__8670 = this;
    var coll__8671 = this_sym8666__8670;
    return coll__8671.cljs$core$ILookup$_lookup$arity$3(coll__8671, k, not_found)
  };
  G__8696 = function(this_sym8666, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8696__2.call(this, this_sym8666, k);
      case 3:
        return G__8696__3.call(this, this_sym8666, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8696
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym8649, args8650) {
  var this__8672 = this;
  return this_sym8649.call.apply(this_sym8649, [this_sym8649].concat(args8650.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8673 = this;
  var len__8674 = this__8673.arr.length;
  var i__8675 = 0;
  var init__8676 = init;
  while(true) {
    if(i__8675 < len__8674) {
      var init__8677 = f.call(null, init__8676, this__8673.arr[i__8675], this__8673.arr[i__8675 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__8677)) {
        return cljs.core.deref.call(null, init__8677)
      }else {
        var G__8697 = i__8675 + 2;
        var G__8698 = init__8677;
        i__8675 = G__8697;
        init__8676 = G__8698;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8678 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__8679 = this;
  var this__8680 = this;
  return cljs.core.pr_str.call(null, this__8680)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8681 = this;
  if(this__8681.cnt > 0) {
    var len__8682 = this__8681.arr.length;
    var array_map_seq__8683 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__8682) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__8681.arr[i], this__8681.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__8683.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8684 = this;
  return this__8684.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8685 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8686 = this;
  return new cljs.core.PersistentArrayMap(meta, this__8686.cnt, this__8686.arr, this__8686.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8687 = this;
  return this__8687.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8688 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__8688.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8689 = this;
  var idx__8690 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8690 >= 0) {
    var len__8691 = this__8689.arr.length;
    var new_len__8692 = len__8691 - 2;
    if(new_len__8692 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__8693 = cljs.core.make_array.call(null, new_len__8692);
      var s__8694 = 0;
      var d__8695 = 0;
      while(true) {
        if(s__8694 >= len__8691) {
          return new cljs.core.PersistentArrayMap(this__8689.meta, this__8689.cnt - 1, new_arr__8693, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__8689.arr[s__8694])) {
            var G__8699 = s__8694 + 2;
            var G__8700 = d__8695;
            s__8694 = G__8699;
            d__8695 = G__8700;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__8693[d__8695] = this__8689.arr[s__8694];
              new_arr__8693[d__8695 + 1] = this__8689.arr[s__8694 + 1];
              var G__8701 = s__8694 + 2;
              var G__8702 = d__8695 + 2;
              s__8694 = G__8701;
              d__8695 = G__8702;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__8703 = cljs.core.count.call(null, ks);
  var i__8704 = 0;
  var out__8705 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__8704 < len__8703) {
      var G__8706 = i__8704 + 1;
      var G__8707 = cljs.core.assoc_BANG_.call(null, out__8705, ks[i__8704], vs[i__8704]);
      i__8704 = G__8706;
      out__8705 = G__8707;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8705)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__8708 = this;
  if(cljs.core.truth_(this__8708.editable_QMARK_)) {
    var idx__8709 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8709 >= 0) {
      this__8708.arr[idx__8709] = this__8708.arr[this__8708.len - 2];
      this__8708.arr[idx__8709 + 1] = this__8708.arr[this__8708.len - 1];
      var G__8710__8711 = this__8708.arr;
      G__8710__8711.pop();
      G__8710__8711.pop();
      G__8710__8711;
      this__8708.len = this__8708.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8712 = this;
  if(cljs.core.truth_(this__8712.editable_QMARK_)) {
    var idx__8713 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8713 === -1) {
      if(this__8712.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__8712.len = this__8712.len + 2;
        this__8712.arr.push(key);
        this__8712.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__8712.len, this__8712.arr), key, val)
      }
    }else {
      if(val === this__8712.arr[idx__8713 + 1]) {
        return tcoll
      }else {
        this__8712.arr[idx__8713 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8714 = this;
  if(cljs.core.truth_(this__8714.editable_QMARK_)) {
    if(function() {
      var G__8715__8716 = o;
      if(G__8715__8716) {
        if(function() {
          var or__3824__auto____8717 = G__8715__8716.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____8717) {
            return or__3824__auto____8717
          }else {
            return G__8715__8716.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__8715__8716.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8715__8716)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8715__8716)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__8718 = cljs.core.seq.call(null, o);
      var tcoll__8719 = tcoll;
      while(true) {
        var temp__3971__auto____8720 = cljs.core.first.call(null, es__8718);
        if(cljs.core.truth_(temp__3971__auto____8720)) {
          var e__8721 = temp__3971__auto____8720;
          var G__8727 = cljs.core.next.call(null, es__8718);
          var G__8728 = tcoll__8719.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__8719, cljs.core.key.call(null, e__8721), cljs.core.val.call(null, e__8721));
          es__8718 = G__8727;
          tcoll__8719 = G__8728;
          continue
        }else {
          return tcoll__8719
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8722 = this;
  if(cljs.core.truth_(this__8722.editable_QMARK_)) {
    this__8722.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__8722.len, 2), this__8722.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8723 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8724 = this;
  if(cljs.core.truth_(this__8724.editable_QMARK_)) {
    var idx__8725 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__8725 === -1) {
      return not_found
    }else {
      return this__8724.arr[idx__8725 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__8726 = this;
  if(cljs.core.truth_(this__8726.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__8726.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__8731 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__8732 = 0;
  while(true) {
    if(i__8732 < len) {
      var G__8733 = cljs.core.assoc_BANG_.call(null, out__8731, arr[i__8732], arr[i__8732 + 1]);
      var G__8734 = i__8732 + 2;
      out__8731 = G__8733;
      i__8732 = G__8734;
      continue
    }else {
      return out__8731
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2334__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__8739__8740 = arr.slice();
    G__8739__8740[i] = a;
    return G__8739__8740
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__8741__8742 = arr.slice();
    G__8741__8742[i] = a;
    G__8741__8742[j] = b;
    return G__8741__8742
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__8744 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__8744, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__8744, 2 * i, new_arr__8744.length - 2 * i);
  return new_arr__8744
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__8747 = inode.ensure_editable(edit);
    editable__8747.arr[i] = a;
    return editable__8747
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__8748 = inode.ensure_editable(edit);
    editable__8748.arr[i] = a;
    editable__8748.arr[j] = b;
    return editable__8748
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__8755 = arr.length;
  var i__8756 = 0;
  var init__8757 = init;
  while(true) {
    if(i__8756 < len__8755) {
      var init__8760 = function() {
        var k__8758 = arr[i__8756];
        if(!(k__8758 == null)) {
          return f.call(null, init__8757, k__8758, arr[i__8756 + 1])
        }else {
          var node__8759 = arr[i__8756 + 1];
          if(!(node__8759 == null)) {
            return node__8759.kv_reduce(f, init__8757)
          }else {
            return init__8757
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8760)) {
        return cljs.core.deref.call(null, init__8760)
      }else {
        var G__8761 = i__8756 + 2;
        var G__8762 = init__8760;
        i__8756 = G__8761;
        init__8757 = G__8762;
        continue
      }
    }else {
      return init__8757
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__8763 = this;
  var inode__8764 = this;
  if(this__8763.bitmap === bit) {
    return null
  }else {
    var editable__8765 = inode__8764.ensure_editable(e);
    var earr__8766 = editable__8765.arr;
    var len__8767 = earr__8766.length;
    editable__8765.bitmap = bit ^ editable__8765.bitmap;
    cljs.core.array_copy.call(null, earr__8766, 2 * (i + 1), earr__8766, 2 * i, len__8767 - 2 * (i + 1));
    earr__8766[len__8767 - 2] = null;
    earr__8766[len__8767 - 1] = null;
    return editable__8765
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8768 = this;
  var inode__8769 = this;
  var bit__8770 = 1 << (hash >>> shift & 31);
  var idx__8771 = cljs.core.bitmap_indexed_node_index.call(null, this__8768.bitmap, bit__8770);
  if((this__8768.bitmap & bit__8770) === 0) {
    var n__8772 = cljs.core.bit_count.call(null, this__8768.bitmap);
    if(2 * n__8772 < this__8768.arr.length) {
      var editable__8773 = inode__8769.ensure_editable(edit);
      var earr__8774 = editable__8773.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__8774, 2 * idx__8771, earr__8774, 2 * (idx__8771 + 1), 2 * (n__8772 - idx__8771));
      earr__8774[2 * idx__8771] = key;
      earr__8774[2 * idx__8771 + 1] = val;
      editable__8773.bitmap = editable__8773.bitmap | bit__8770;
      return editable__8773
    }else {
      if(n__8772 >= 16) {
        var nodes__8775 = cljs.core.make_array.call(null, 32);
        var jdx__8776 = hash >>> shift & 31;
        nodes__8775[jdx__8776] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__8777 = 0;
        var j__8778 = 0;
        while(true) {
          if(i__8777 < 32) {
            if((this__8768.bitmap >>> i__8777 & 1) === 0) {
              var G__8831 = i__8777 + 1;
              var G__8832 = j__8778;
              i__8777 = G__8831;
              j__8778 = G__8832;
              continue
            }else {
              nodes__8775[i__8777] = !(this__8768.arr[j__8778] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__8768.arr[j__8778]), this__8768.arr[j__8778], this__8768.arr[j__8778 + 1], added_leaf_QMARK_) : this__8768.arr[j__8778 + 1];
              var G__8833 = i__8777 + 1;
              var G__8834 = j__8778 + 2;
              i__8777 = G__8833;
              j__8778 = G__8834;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__8772 + 1, nodes__8775)
      }else {
        if("\ufdd0'else") {
          var new_arr__8779 = cljs.core.make_array.call(null, 2 * (n__8772 + 4));
          cljs.core.array_copy.call(null, this__8768.arr, 0, new_arr__8779, 0, 2 * idx__8771);
          new_arr__8779[2 * idx__8771] = key;
          new_arr__8779[2 * idx__8771 + 1] = val;
          cljs.core.array_copy.call(null, this__8768.arr, 2 * idx__8771, new_arr__8779, 2 * (idx__8771 + 1), 2 * (n__8772 - idx__8771));
          added_leaf_QMARK_.val = true;
          var editable__8780 = inode__8769.ensure_editable(edit);
          editable__8780.arr = new_arr__8779;
          editable__8780.bitmap = editable__8780.bitmap | bit__8770;
          return editable__8780
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__8781 = this__8768.arr[2 * idx__8771];
    var val_or_node__8782 = this__8768.arr[2 * idx__8771 + 1];
    if(key_or_nil__8781 == null) {
      var n__8783 = val_or_node__8782.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8783 === val_or_node__8782) {
        return inode__8769
      }else {
        return cljs.core.edit_and_set.call(null, inode__8769, edit, 2 * idx__8771 + 1, n__8783)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8781)) {
        if(val === val_or_node__8782) {
          return inode__8769
        }else {
          return cljs.core.edit_and_set.call(null, inode__8769, edit, 2 * idx__8771 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__8769, edit, 2 * idx__8771, null, 2 * idx__8771 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__8781, val_or_node__8782, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__8784 = this;
  var inode__8785 = this;
  return cljs.core.create_inode_seq.call(null, this__8784.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8786 = this;
  var inode__8787 = this;
  var bit__8788 = 1 << (hash >>> shift & 31);
  if((this__8786.bitmap & bit__8788) === 0) {
    return inode__8787
  }else {
    var idx__8789 = cljs.core.bitmap_indexed_node_index.call(null, this__8786.bitmap, bit__8788);
    var key_or_nil__8790 = this__8786.arr[2 * idx__8789];
    var val_or_node__8791 = this__8786.arr[2 * idx__8789 + 1];
    if(key_or_nil__8790 == null) {
      var n__8792 = val_or_node__8791.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__8792 === val_or_node__8791) {
        return inode__8787
      }else {
        if(!(n__8792 == null)) {
          return cljs.core.edit_and_set.call(null, inode__8787, edit, 2 * idx__8789 + 1, n__8792)
        }else {
          if(this__8786.bitmap === bit__8788) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__8787.edit_and_remove_pair(edit, bit__8788, idx__8789)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8790)) {
        removed_leaf_QMARK_[0] = true;
        return inode__8787.edit_and_remove_pair(edit, bit__8788, idx__8789)
      }else {
        if("\ufdd0'else") {
          return inode__8787
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__8793 = this;
  var inode__8794 = this;
  if(e === this__8793.edit) {
    return inode__8794
  }else {
    var n__8795 = cljs.core.bit_count.call(null, this__8793.bitmap);
    var new_arr__8796 = cljs.core.make_array.call(null, n__8795 < 0 ? 4 : 2 * (n__8795 + 1));
    cljs.core.array_copy.call(null, this__8793.arr, 0, new_arr__8796, 0, 2 * n__8795);
    return new cljs.core.BitmapIndexedNode(e, this__8793.bitmap, new_arr__8796)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__8797 = this;
  var inode__8798 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8797.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8799 = this;
  var inode__8800 = this;
  var bit__8801 = 1 << (hash >>> shift & 31);
  if((this__8799.bitmap & bit__8801) === 0) {
    return not_found
  }else {
    var idx__8802 = cljs.core.bitmap_indexed_node_index.call(null, this__8799.bitmap, bit__8801);
    var key_or_nil__8803 = this__8799.arr[2 * idx__8802];
    var val_or_node__8804 = this__8799.arr[2 * idx__8802 + 1];
    if(key_or_nil__8803 == null) {
      return val_or_node__8804.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8803)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__8803, val_or_node__8804], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__8805 = this;
  var inode__8806 = this;
  var bit__8807 = 1 << (hash >>> shift & 31);
  if((this__8805.bitmap & bit__8807) === 0) {
    return inode__8806
  }else {
    var idx__8808 = cljs.core.bitmap_indexed_node_index.call(null, this__8805.bitmap, bit__8807);
    var key_or_nil__8809 = this__8805.arr[2 * idx__8808];
    var val_or_node__8810 = this__8805.arr[2 * idx__8808 + 1];
    if(key_or_nil__8809 == null) {
      var n__8811 = val_or_node__8810.inode_without(shift + 5, hash, key);
      if(n__8811 === val_or_node__8810) {
        return inode__8806
      }else {
        if(!(n__8811 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__8805.bitmap, cljs.core.clone_and_set.call(null, this__8805.arr, 2 * idx__8808 + 1, n__8811))
        }else {
          if(this__8805.bitmap === bit__8807) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__8805.bitmap ^ bit__8807, cljs.core.remove_pair.call(null, this__8805.arr, idx__8808))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8809)) {
        return new cljs.core.BitmapIndexedNode(null, this__8805.bitmap ^ bit__8807, cljs.core.remove_pair.call(null, this__8805.arr, idx__8808))
      }else {
        if("\ufdd0'else") {
          return inode__8806
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8812 = this;
  var inode__8813 = this;
  var bit__8814 = 1 << (hash >>> shift & 31);
  var idx__8815 = cljs.core.bitmap_indexed_node_index.call(null, this__8812.bitmap, bit__8814);
  if((this__8812.bitmap & bit__8814) === 0) {
    var n__8816 = cljs.core.bit_count.call(null, this__8812.bitmap);
    if(n__8816 >= 16) {
      var nodes__8817 = cljs.core.make_array.call(null, 32);
      var jdx__8818 = hash >>> shift & 31;
      nodes__8817[jdx__8818] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__8819 = 0;
      var j__8820 = 0;
      while(true) {
        if(i__8819 < 32) {
          if((this__8812.bitmap >>> i__8819 & 1) === 0) {
            var G__8835 = i__8819 + 1;
            var G__8836 = j__8820;
            i__8819 = G__8835;
            j__8820 = G__8836;
            continue
          }else {
            nodes__8817[i__8819] = !(this__8812.arr[j__8820] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__8812.arr[j__8820]), this__8812.arr[j__8820], this__8812.arr[j__8820 + 1], added_leaf_QMARK_) : this__8812.arr[j__8820 + 1];
            var G__8837 = i__8819 + 1;
            var G__8838 = j__8820 + 2;
            i__8819 = G__8837;
            j__8820 = G__8838;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__8816 + 1, nodes__8817)
    }else {
      var new_arr__8821 = cljs.core.make_array.call(null, 2 * (n__8816 + 1));
      cljs.core.array_copy.call(null, this__8812.arr, 0, new_arr__8821, 0, 2 * idx__8815);
      new_arr__8821[2 * idx__8815] = key;
      new_arr__8821[2 * idx__8815 + 1] = val;
      cljs.core.array_copy.call(null, this__8812.arr, 2 * idx__8815, new_arr__8821, 2 * (idx__8815 + 1), 2 * (n__8816 - idx__8815));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__8812.bitmap | bit__8814, new_arr__8821)
    }
  }else {
    var key_or_nil__8822 = this__8812.arr[2 * idx__8815];
    var val_or_node__8823 = this__8812.arr[2 * idx__8815 + 1];
    if(key_or_nil__8822 == null) {
      var n__8824 = val_or_node__8823.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8824 === val_or_node__8823) {
        return inode__8813
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__8812.bitmap, cljs.core.clone_and_set.call(null, this__8812.arr, 2 * idx__8815 + 1, n__8824))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8822)) {
        if(val === val_or_node__8823) {
          return inode__8813
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__8812.bitmap, cljs.core.clone_and_set.call(null, this__8812.arr, 2 * idx__8815 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__8812.bitmap, cljs.core.clone_and_set.call(null, this__8812.arr, 2 * idx__8815, null, 2 * idx__8815 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__8822, val_or_node__8823, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8825 = this;
  var inode__8826 = this;
  var bit__8827 = 1 << (hash >>> shift & 31);
  if((this__8825.bitmap & bit__8827) === 0) {
    return not_found
  }else {
    var idx__8828 = cljs.core.bitmap_indexed_node_index.call(null, this__8825.bitmap, bit__8827);
    var key_or_nil__8829 = this__8825.arr[2 * idx__8828];
    var val_or_node__8830 = this__8825.arr[2 * idx__8828 + 1];
    if(key_or_nil__8829 == null) {
      return val_or_node__8830.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8829)) {
        return val_or_node__8830
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__8846 = array_node.arr;
  var len__8847 = 2 * (array_node.cnt - 1);
  var new_arr__8848 = cljs.core.make_array.call(null, len__8847);
  var i__8849 = 0;
  var j__8850 = 1;
  var bitmap__8851 = 0;
  while(true) {
    if(i__8849 < len__8847) {
      if(function() {
        var and__3822__auto____8852 = !(i__8849 === idx);
        if(and__3822__auto____8852) {
          return!(arr__8846[i__8849] == null)
        }else {
          return and__3822__auto____8852
        }
      }()) {
        new_arr__8848[j__8850] = arr__8846[i__8849];
        var G__8853 = i__8849 + 1;
        var G__8854 = j__8850 + 2;
        var G__8855 = bitmap__8851 | 1 << i__8849;
        i__8849 = G__8853;
        j__8850 = G__8854;
        bitmap__8851 = G__8855;
        continue
      }else {
        var G__8856 = i__8849 + 1;
        var G__8857 = j__8850;
        var G__8858 = bitmap__8851;
        i__8849 = G__8856;
        j__8850 = G__8857;
        bitmap__8851 = G__8858;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__8851, new_arr__8848)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8859 = this;
  var inode__8860 = this;
  var idx__8861 = hash >>> shift & 31;
  var node__8862 = this__8859.arr[idx__8861];
  if(node__8862 == null) {
    var editable__8863 = cljs.core.edit_and_set.call(null, inode__8860, edit, idx__8861, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__8863.cnt = editable__8863.cnt + 1;
    return editable__8863
  }else {
    var n__8864 = node__8862.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8864 === node__8862) {
      return inode__8860
    }else {
      return cljs.core.edit_and_set.call(null, inode__8860, edit, idx__8861, n__8864)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__8865 = this;
  var inode__8866 = this;
  return cljs.core.create_array_node_seq.call(null, this__8865.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8867 = this;
  var inode__8868 = this;
  var idx__8869 = hash >>> shift & 31;
  var node__8870 = this__8867.arr[idx__8869];
  if(node__8870 == null) {
    return inode__8868
  }else {
    var n__8871 = node__8870.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__8871 === node__8870) {
      return inode__8868
    }else {
      if(n__8871 == null) {
        if(this__8867.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8868, edit, idx__8869)
        }else {
          var editable__8872 = cljs.core.edit_and_set.call(null, inode__8868, edit, idx__8869, n__8871);
          editable__8872.cnt = editable__8872.cnt - 1;
          return editable__8872
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__8868, edit, idx__8869, n__8871)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__8873 = this;
  var inode__8874 = this;
  if(e === this__8873.edit) {
    return inode__8874
  }else {
    return new cljs.core.ArrayNode(e, this__8873.cnt, this__8873.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__8875 = this;
  var inode__8876 = this;
  var len__8877 = this__8875.arr.length;
  var i__8878 = 0;
  var init__8879 = init;
  while(true) {
    if(i__8878 < len__8877) {
      var node__8880 = this__8875.arr[i__8878];
      if(!(node__8880 == null)) {
        var init__8881 = node__8880.kv_reduce(f, init__8879);
        if(cljs.core.reduced_QMARK_.call(null, init__8881)) {
          return cljs.core.deref.call(null, init__8881)
        }else {
          var G__8900 = i__8878 + 1;
          var G__8901 = init__8881;
          i__8878 = G__8900;
          init__8879 = G__8901;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__8879
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8882 = this;
  var inode__8883 = this;
  var idx__8884 = hash >>> shift & 31;
  var node__8885 = this__8882.arr[idx__8884];
  if(!(node__8885 == null)) {
    return node__8885.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__8886 = this;
  var inode__8887 = this;
  var idx__8888 = hash >>> shift & 31;
  var node__8889 = this__8886.arr[idx__8888];
  if(!(node__8889 == null)) {
    var n__8890 = node__8889.inode_without(shift + 5, hash, key);
    if(n__8890 === node__8889) {
      return inode__8887
    }else {
      if(n__8890 == null) {
        if(this__8886.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8887, null, idx__8888)
        }else {
          return new cljs.core.ArrayNode(null, this__8886.cnt - 1, cljs.core.clone_and_set.call(null, this__8886.arr, idx__8888, n__8890))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__8886.cnt, cljs.core.clone_and_set.call(null, this__8886.arr, idx__8888, n__8890))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__8887
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8891 = this;
  var inode__8892 = this;
  var idx__8893 = hash >>> shift & 31;
  var node__8894 = this__8891.arr[idx__8893];
  if(node__8894 == null) {
    return new cljs.core.ArrayNode(null, this__8891.cnt + 1, cljs.core.clone_and_set.call(null, this__8891.arr, idx__8893, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__8895 = node__8894.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8895 === node__8894) {
      return inode__8892
    }else {
      return new cljs.core.ArrayNode(null, this__8891.cnt, cljs.core.clone_and_set.call(null, this__8891.arr, idx__8893, n__8895))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8896 = this;
  var inode__8897 = this;
  var idx__8898 = hash >>> shift & 31;
  var node__8899 = this__8896.arr[idx__8898];
  if(!(node__8899 == null)) {
    return node__8899.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__8904 = 2 * cnt;
  var i__8905 = 0;
  while(true) {
    if(i__8905 < lim__8904) {
      if(cljs.core.key_test.call(null, key, arr[i__8905])) {
        return i__8905
      }else {
        var G__8906 = i__8905 + 2;
        i__8905 = G__8906;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8907 = this;
  var inode__8908 = this;
  if(hash === this__8907.collision_hash) {
    var idx__8909 = cljs.core.hash_collision_node_find_index.call(null, this__8907.arr, this__8907.cnt, key);
    if(idx__8909 === -1) {
      if(this__8907.arr.length > 2 * this__8907.cnt) {
        var editable__8910 = cljs.core.edit_and_set.call(null, inode__8908, edit, 2 * this__8907.cnt, key, 2 * this__8907.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__8910.cnt = editable__8910.cnt + 1;
        return editable__8910
      }else {
        var len__8911 = this__8907.arr.length;
        var new_arr__8912 = cljs.core.make_array.call(null, len__8911 + 2);
        cljs.core.array_copy.call(null, this__8907.arr, 0, new_arr__8912, 0, len__8911);
        new_arr__8912[len__8911] = key;
        new_arr__8912[len__8911 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__8908.ensure_editable_array(edit, this__8907.cnt + 1, new_arr__8912)
      }
    }else {
      if(this__8907.arr[idx__8909 + 1] === val) {
        return inode__8908
      }else {
        return cljs.core.edit_and_set.call(null, inode__8908, edit, idx__8909 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__8907.collision_hash >>> shift & 31), [null, inode__8908, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__8913 = this;
  var inode__8914 = this;
  return cljs.core.create_inode_seq.call(null, this__8913.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8915 = this;
  var inode__8916 = this;
  var idx__8917 = cljs.core.hash_collision_node_find_index.call(null, this__8915.arr, this__8915.cnt, key);
  if(idx__8917 === -1) {
    return inode__8916
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__8915.cnt === 1) {
      return null
    }else {
      var editable__8918 = inode__8916.ensure_editable(edit);
      var earr__8919 = editable__8918.arr;
      earr__8919[idx__8917] = earr__8919[2 * this__8915.cnt - 2];
      earr__8919[idx__8917 + 1] = earr__8919[2 * this__8915.cnt - 1];
      earr__8919[2 * this__8915.cnt - 1] = null;
      earr__8919[2 * this__8915.cnt - 2] = null;
      editable__8918.cnt = editable__8918.cnt - 1;
      return editable__8918
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__8920 = this;
  var inode__8921 = this;
  if(e === this__8920.edit) {
    return inode__8921
  }else {
    var new_arr__8922 = cljs.core.make_array.call(null, 2 * (this__8920.cnt + 1));
    cljs.core.array_copy.call(null, this__8920.arr, 0, new_arr__8922, 0, 2 * this__8920.cnt);
    return new cljs.core.HashCollisionNode(e, this__8920.collision_hash, this__8920.cnt, new_arr__8922)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__8923 = this;
  var inode__8924 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8923.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8925 = this;
  var inode__8926 = this;
  var idx__8927 = cljs.core.hash_collision_node_find_index.call(null, this__8925.arr, this__8925.cnt, key);
  if(idx__8927 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8925.arr[idx__8927])) {
      return cljs.core.PersistentVector.fromArray([this__8925.arr[idx__8927], this__8925.arr[idx__8927 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__8928 = this;
  var inode__8929 = this;
  var idx__8930 = cljs.core.hash_collision_node_find_index.call(null, this__8928.arr, this__8928.cnt, key);
  if(idx__8930 === -1) {
    return inode__8929
  }else {
    if(this__8928.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__8928.collision_hash, this__8928.cnt - 1, cljs.core.remove_pair.call(null, this__8928.arr, cljs.core.quot.call(null, idx__8930, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8931 = this;
  var inode__8932 = this;
  if(hash === this__8931.collision_hash) {
    var idx__8933 = cljs.core.hash_collision_node_find_index.call(null, this__8931.arr, this__8931.cnt, key);
    if(idx__8933 === -1) {
      var len__8934 = this__8931.arr.length;
      var new_arr__8935 = cljs.core.make_array.call(null, len__8934 + 2);
      cljs.core.array_copy.call(null, this__8931.arr, 0, new_arr__8935, 0, len__8934);
      new_arr__8935[len__8934] = key;
      new_arr__8935[len__8934 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__8931.collision_hash, this__8931.cnt + 1, new_arr__8935)
    }else {
      if(cljs.core._EQ_.call(null, this__8931.arr[idx__8933], val)) {
        return inode__8932
      }else {
        return new cljs.core.HashCollisionNode(null, this__8931.collision_hash, this__8931.cnt, cljs.core.clone_and_set.call(null, this__8931.arr, idx__8933 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__8931.collision_hash >>> shift & 31), [null, inode__8932])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8936 = this;
  var inode__8937 = this;
  var idx__8938 = cljs.core.hash_collision_node_find_index.call(null, this__8936.arr, this__8936.cnt, key);
  if(idx__8938 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8936.arr[idx__8938])) {
      return this__8936.arr[idx__8938 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__8939 = this;
  var inode__8940 = this;
  if(e === this__8939.edit) {
    this__8939.arr = array;
    this__8939.cnt = count;
    return inode__8940
  }else {
    return new cljs.core.HashCollisionNode(this__8939.edit, this__8939.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8945 = cljs.core.hash.call(null, key1);
    if(key1hash__8945 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8945, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8946 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__8945, key1, val1, added_leaf_QMARK___8946).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___8946)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8947 = cljs.core.hash.call(null, key1);
    if(key1hash__8947 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8947, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8948 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__8947, key1, val1, added_leaf_QMARK___8948).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___8948)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8949 = this;
  var h__2216__auto____8950 = this__8949.__hash;
  if(!(h__2216__auto____8950 == null)) {
    return h__2216__auto____8950
  }else {
    var h__2216__auto____8951 = cljs.core.hash_coll.call(null, coll);
    this__8949.__hash = h__2216__auto____8951;
    return h__2216__auto____8951
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8952 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__8953 = this;
  var this__8954 = this;
  return cljs.core.pr_str.call(null, this__8954)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8955 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8956 = this;
  if(this__8956.s == null) {
    return cljs.core.PersistentVector.fromArray([this__8956.nodes[this__8956.i], this__8956.nodes[this__8956.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__8956.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8957 = this;
  if(this__8957.s == null) {
    return cljs.core.create_inode_seq.call(null, this__8957.nodes, this__8957.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__8957.nodes, this__8957.i, cljs.core.next.call(null, this__8957.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8958 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8959 = this;
  return new cljs.core.NodeSeq(meta, this__8959.nodes, this__8959.i, this__8959.s, this__8959.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8960 = this;
  return this__8960.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8961 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8961.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__8968 = nodes.length;
      var j__8969 = i;
      while(true) {
        if(j__8969 < len__8968) {
          if(!(nodes[j__8969] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__8969, null, null)
          }else {
            var temp__3971__auto____8970 = nodes[j__8969 + 1];
            if(cljs.core.truth_(temp__3971__auto____8970)) {
              var node__8971 = temp__3971__auto____8970;
              var temp__3971__auto____8972 = node__8971.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____8972)) {
                var node_seq__8973 = temp__3971__auto____8972;
                return new cljs.core.NodeSeq(null, nodes, j__8969 + 2, node_seq__8973, null)
              }else {
                var G__8974 = j__8969 + 2;
                j__8969 = G__8974;
                continue
              }
            }else {
              var G__8975 = j__8969 + 2;
              j__8969 = G__8975;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8976 = this;
  var h__2216__auto____8977 = this__8976.__hash;
  if(!(h__2216__auto____8977 == null)) {
    return h__2216__auto____8977
  }else {
    var h__2216__auto____8978 = cljs.core.hash_coll.call(null, coll);
    this__8976.__hash = h__2216__auto____8978;
    return h__2216__auto____8978
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8979 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__8980 = this;
  var this__8981 = this;
  return cljs.core.pr_str.call(null, this__8981)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8982 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8983 = this;
  return cljs.core.first.call(null, this__8983.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8984 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__8984.nodes, this__8984.i, cljs.core.next.call(null, this__8984.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8985 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8986 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__8986.nodes, this__8986.i, this__8986.s, this__8986.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8987 = this;
  return this__8987.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8988 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8988.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__8995 = nodes.length;
      var j__8996 = i;
      while(true) {
        if(j__8996 < len__8995) {
          var temp__3971__auto____8997 = nodes[j__8996];
          if(cljs.core.truth_(temp__3971__auto____8997)) {
            var nj__8998 = temp__3971__auto____8997;
            var temp__3971__auto____8999 = nj__8998.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____8999)) {
              var ns__9000 = temp__3971__auto____8999;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__8996 + 1, ns__9000, null)
            }else {
              var G__9001 = j__8996 + 1;
              j__8996 = G__9001;
              continue
            }
          }else {
            var G__9002 = j__8996 + 1;
            j__8996 = G__9002;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9005 = this;
  return new cljs.core.TransientHashMap({}, this__9005.root, this__9005.cnt, this__9005.has_nil_QMARK_, this__9005.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9006 = this;
  var h__2216__auto____9007 = this__9006.__hash;
  if(!(h__2216__auto____9007 == null)) {
    return h__2216__auto____9007
  }else {
    var h__2216__auto____9008 = cljs.core.hash_imap.call(null, coll);
    this__9006.__hash = h__2216__auto____9008;
    return h__2216__auto____9008
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9009 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9010 = this;
  if(k == null) {
    if(this__9010.has_nil_QMARK_) {
      return this__9010.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9010.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__9010.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9011 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____9012 = this__9011.has_nil_QMARK_;
      if(and__3822__auto____9012) {
        return v === this__9011.nil_val
      }else {
        return and__3822__auto____9012
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9011.meta, this__9011.has_nil_QMARK_ ? this__9011.cnt : this__9011.cnt + 1, this__9011.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___9013 = new cljs.core.Box(false);
    var new_root__9014 = (this__9011.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9011.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9013);
    if(new_root__9014 === this__9011.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9011.meta, added_leaf_QMARK___9013.val ? this__9011.cnt + 1 : this__9011.cnt, new_root__9014, this__9011.has_nil_QMARK_, this__9011.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9015 = this;
  if(k == null) {
    return this__9015.has_nil_QMARK_
  }else {
    if(this__9015.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__9015.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__9038 = null;
  var G__9038__2 = function(this_sym9016, k) {
    var this__9018 = this;
    var this_sym9016__9019 = this;
    var coll__9020 = this_sym9016__9019;
    return coll__9020.cljs$core$ILookup$_lookup$arity$2(coll__9020, k)
  };
  var G__9038__3 = function(this_sym9017, k, not_found) {
    var this__9018 = this;
    var this_sym9017__9021 = this;
    var coll__9022 = this_sym9017__9021;
    return coll__9022.cljs$core$ILookup$_lookup$arity$3(coll__9022, k, not_found)
  };
  G__9038 = function(this_sym9017, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9038__2.call(this, this_sym9017, k);
      case 3:
        return G__9038__3.call(this, this_sym9017, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9038
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym9003, args9004) {
  var this__9023 = this;
  return this_sym9003.call.apply(this_sym9003, [this_sym9003].concat(args9004.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9024 = this;
  var init__9025 = this__9024.has_nil_QMARK_ ? f.call(null, init, null, this__9024.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__9025)) {
    return cljs.core.deref.call(null, init__9025)
  }else {
    if(!(this__9024.root == null)) {
      return this__9024.root.kv_reduce(f, init__9025)
    }else {
      if("\ufdd0'else") {
        return init__9025
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9026 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__9027 = this;
  var this__9028 = this;
  return cljs.core.pr_str.call(null, this__9028)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9029 = this;
  if(this__9029.cnt > 0) {
    var s__9030 = !(this__9029.root == null) ? this__9029.root.inode_seq() : null;
    if(this__9029.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__9029.nil_val], true), s__9030)
    }else {
      return s__9030
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9031 = this;
  return this__9031.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9032 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9033 = this;
  return new cljs.core.PersistentHashMap(meta, this__9033.cnt, this__9033.root, this__9033.has_nil_QMARK_, this__9033.nil_val, this__9033.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9034 = this;
  return this__9034.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9035 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__9035.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9036 = this;
  if(k == null) {
    if(this__9036.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__9036.meta, this__9036.cnt - 1, this__9036.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__9036.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__9037 = this__9036.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__9037 === this__9036.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__9036.meta, this__9036.cnt - 1, new_root__9037, this__9036.has_nil_QMARK_, this__9036.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__9039 = ks.length;
  var i__9040 = 0;
  var out__9041 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__9040 < len__9039) {
      var G__9042 = i__9040 + 1;
      var G__9043 = cljs.core.assoc_BANG_.call(null, out__9041, ks[i__9040], vs[i__9040]);
      i__9040 = G__9042;
      out__9041 = G__9043;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9041)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__9044 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9045 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__9046 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9047 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9048 = this;
  if(k == null) {
    if(this__9048.has_nil_QMARK_) {
      return this__9048.nil_val
    }else {
      return null
    }
  }else {
    if(this__9048.root == null) {
      return null
    }else {
      return this__9048.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9049 = this;
  if(k == null) {
    if(this__9049.has_nil_QMARK_) {
      return this__9049.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9049.root == null) {
      return not_found
    }else {
      return this__9049.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9050 = this;
  if(this__9050.edit) {
    return this__9050.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__9051 = this;
  var tcoll__9052 = this;
  if(this__9051.edit) {
    if(function() {
      var G__9053__9054 = o;
      if(G__9053__9054) {
        if(function() {
          var or__3824__auto____9055 = G__9053__9054.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9055) {
            return or__3824__auto____9055
          }else {
            return G__9053__9054.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9053__9054.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9053__9054)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9053__9054)
      }
    }()) {
      return tcoll__9052.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9056 = cljs.core.seq.call(null, o);
      var tcoll__9057 = tcoll__9052;
      while(true) {
        var temp__3971__auto____9058 = cljs.core.first.call(null, es__9056);
        if(cljs.core.truth_(temp__3971__auto____9058)) {
          var e__9059 = temp__3971__auto____9058;
          var G__9070 = cljs.core.next.call(null, es__9056);
          var G__9071 = tcoll__9057.assoc_BANG_(cljs.core.key.call(null, e__9059), cljs.core.val.call(null, e__9059));
          es__9056 = G__9070;
          tcoll__9057 = G__9071;
          continue
        }else {
          return tcoll__9057
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9060 = this;
  var tcoll__9061 = this;
  if(this__9060.edit) {
    if(k == null) {
      if(this__9060.nil_val === v) {
      }else {
        this__9060.nil_val = v
      }
      if(this__9060.has_nil_QMARK_) {
      }else {
        this__9060.count = this__9060.count + 1;
        this__9060.has_nil_QMARK_ = true
      }
      return tcoll__9061
    }else {
      var added_leaf_QMARK___9062 = new cljs.core.Box(false);
      var node__9063 = (this__9060.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9060.root).inode_assoc_BANG_(this__9060.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9062);
      if(node__9063 === this__9060.root) {
      }else {
        this__9060.root = node__9063
      }
      if(added_leaf_QMARK___9062.val) {
        this__9060.count = this__9060.count + 1
      }else {
      }
      return tcoll__9061
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9064 = this;
  var tcoll__9065 = this;
  if(this__9064.edit) {
    if(k == null) {
      if(this__9064.has_nil_QMARK_) {
        this__9064.has_nil_QMARK_ = false;
        this__9064.nil_val = null;
        this__9064.count = this__9064.count - 1;
        return tcoll__9065
      }else {
        return tcoll__9065
      }
    }else {
      if(this__9064.root == null) {
        return tcoll__9065
      }else {
        var removed_leaf_QMARK___9066 = new cljs.core.Box(false);
        var node__9067 = this__9064.root.inode_without_BANG_(this__9064.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___9066);
        if(node__9067 === this__9064.root) {
        }else {
          this__9064.root = node__9067
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9066[0])) {
          this__9064.count = this__9064.count - 1
        }else {
        }
        return tcoll__9065
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9068 = this;
  var tcoll__9069 = this;
  if(this__9068.edit) {
    this__9068.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9068.count, this__9068.root, this__9068.has_nil_QMARK_, this__9068.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__9074 = node;
  var stack__9075 = stack;
  while(true) {
    if(!(t__9074 == null)) {
      var G__9076 = ascending_QMARK_ ? t__9074.left : t__9074.right;
      var G__9077 = cljs.core.conj.call(null, stack__9075, t__9074);
      t__9074 = G__9076;
      stack__9075 = G__9077;
      continue
    }else {
      return stack__9075
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9078 = this;
  var h__2216__auto____9079 = this__9078.__hash;
  if(!(h__2216__auto____9079 == null)) {
    return h__2216__auto____9079
  }else {
    var h__2216__auto____9080 = cljs.core.hash_coll.call(null, coll);
    this__9078.__hash = h__2216__auto____9080;
    return h__2216__auto____9080
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9081 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__9082 = this;
  var this__9083 = this;
  return cljs.core.pr_str.call(null, this__9083)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9084 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9085 = this;
  if(this__9085.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__9085.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9086 = this;
  return cljs.core.peek.call(null, this__9086.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9087 = this;
  var t__9088 = cljs.core.first.call(null, this__9087.stack);
  var next_stack__9089 = cljs.core.tree_map_seq_push.call(null, this__9087.ascending_QMARK_ ? t__9088.right : t__9088.left, cljs.core.next.call(null, this__9087.stack), this__9087.ascending_QMARK_);
  if(!(next_stack__9089 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9089, this__9087.ascending_QMARK_, this__9087.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9090 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9091 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9091.stack, this__9091.ascending_QMARK_, this__9091.cnt, this__9091.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9092 = this;
  return this__9092.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____9094 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____9094) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____9094
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____9096 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____9096) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____9096
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__9100 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__9100)) {
    return cljs.core.deref.call(null, init__9100)
  }else {
    var init__9101 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__9100) : init__9100;
    if(cljs.core.reduced_QMARK_.call(null, init__9101)) {
      return cljs.core.deref.call(null, init__9101)
    }else {
      var init__9102 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__9101) : init__9101;
      if(cljs.core.reduced_QMARK_.call(null, init__9102)) {
        return cljs.core.deref.call(null, init__9102)
      }else {
        return init__9102
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9105 = this;
  var h__2216__auto____9106 = this__9105.__hash;
  if(!(h__2216__auto____9106 == null)) {
    return h__2216__auto____9106
  }else {
    var h__2216__auto____9107 = cljs.core.hash_coll.call(null, coll);
    this__9105.__hash = h__2216__auto____9107;
    return h__2216__auto____9107
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9108 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9109 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9110 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9110.key, this__9110.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__9158 = null;
  var G__9158__2 = function(this_sym9111, k) {
    var this__9113 = this;
    var this_sym9111__9114 = this;
    var node__9115 = this_sym9111__9114;
    return node__9115.cljs$core$ILookup$_lookup$arity$2(node__9115, k)
  };
  var G__9158__3 = function(this_sym9112, k, not_found) {
    var this__9113 = this;
    var this_sym9112__9116 = this;
    var node__9117 = this_sym9112__9116;
    return node__9117.cljs$core$ILookup$_lookup$arity$3(node__9117, k, not_found)
  };
  G__9158 = function(this_sym9112, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9158__2.call(this, this_sym9112, k);
      case 3:
        return G__9158__3.call(this, this_sym9112, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9158
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9103, args9104) {
  var this__9118 = this;
  return this_sym9103.call.apply(this_sym9103, [this_sym9103].concat(args9104.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9119 = this;
  return cljs.core.PersistentVector.fromArray([this__9119.key, this__9119.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9120 = this;
  return this__9120.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9121 = this;
  return this__9121.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9122 = this;
  var node__9123 = this;
  return ins.balance_right(node__9123)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9124 = this;
  var node__9125 = this;
  return new cljs.core.RedNode(this__9124.key, this__9124.val, this__9124.left, this__9124.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9126 = this;
  var node__9127 = this;
  return cljs.core.balance_right_del.call(null, this__9126.key, this__9126.val, this__9126.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9128 = this;
  var node__9129 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9130 = this;
  var node__9131 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9131, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9132 = this;
  var node__9133 = this;
  return cljs.core.balance_left_del.call(null, this__9132.key, this__9132.val, del, this__9132.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9134 = this;
  var node__9135 = this;
  return ins.balance_left(node__9135)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9136 = this;
  var node__9137 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9137, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__9159 = null;
  var G__9159__0 = function() {
    var this__9138 = this;
    var this__9140 = this;
    return cljs.core.pr_str.call(null, this__9140)
  };
  G__9159 = function() {
    switch(arguments.length) {
      case 0:
        return G__9159__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9159
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__9141 = this;
  var node__9142 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9142, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__9143 = this;
  var node__9144 = this;
  return node__9144
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9145 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9146 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9147 = this;
  return cljs.core.list.call(null, this__9147.key, this__9147.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9148 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9149 = this;
  return this__9149.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9150 = this;
  return cljs.core.PersistentVector.fromArray([this__9150.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9151 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9151.key, this__9151.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9152 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9153 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9153.key, this__9153.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9154 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9155 = this;
  if(n === 0) {
    return this__9155.key
  }else {
    if(n === 1) {
      return this__9155.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9156 = this;
  if(n === 0) {
    return this__9156.key
  }else {
    if(n === 1) {
      return this__9156.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9157 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9162 = this;
  var h__2216__auto____9163 = this__9162.__hash;
  if(!(h__2216__auto____9163 == null)) {
    return h__2216__auto____9163
  }else {
    var h__2216__auto____9164 = cljs.core.hash_coll.call(null, coll);
    this__9162.__hash = h__2216__auto____9164;
    return h__2216__auto____9164
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9165 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9166 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9167 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9167.key, this__9167.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__9215 = null;
  var G__9215__2 = function(this_sym9168, k) {
    var this__9170 = this;
    var this_sym9168__9171 = this;
    var node__9172 = this_sym9168__9171;
    return node__9172.cljs$core$ILookup$_lookup$arity$2(node__9172, k)
  };
  var G__9215__3 = function(this_sym9169, k, not_found) {
    var this__9170 = this;
    var this_sym9169__9173 = this;
    var node__9174 = this_sym9169__9173;
    return node__9174.cljs$core$ILookup$_lookup$arity$3(node__9174, k, not_found)
  };
  G__9215 = function(this_sym9169, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9215__2.call(this, this_sym9169, k);
      case 3:
        return G__9215__3.call(this, this_sym9169, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9215
}();
cljs.core.RedNode.prototype.apply = function(this_sym9160, args9161) {
  var this__9175 = this;
  return this_sym9160.call.apply(this_sym9160, [this_sym9160].concat(args9161.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9176 = this;
  return cljs.core.PersistentVector.fromArray([this__9176.key, this__9176.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9177 = this;
  return this__9177.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9178 = this;
  return this__9178.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__9179 = this;
  var node__9180 = this;
  return new cljs.core.RedNode(this__9179.key, this__9179.val, this__9179.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__9181 = this;
  var node__9182 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__9183 = this;
  var node__9184 = this;
  return new cljs.core.RedNode(this__9183.key, this__9183.val, this__9183.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__9185 = this;
  var node__9186 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__9187 = this;
  var node__9188 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9188, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__9189 = this;
  var node__9190 = this;
  return new cljs.core.RedNode(this__9189.key, this__9189.val, del, this__9189.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__9191 = this;
  var node__9192 = this;
  return new cljs.core.RedNode(this__9191.key, this__9191.val, ins, this__9191.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__9193 = this;
  var node__9194 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9193.left)) {
    return new cljs.core.RedNode(this__9193.key, this__9193.val, this__9193.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__9193.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9193.right)) {
      return new cljs.core.RedNode(this__9193.right.key, this__9193.right.val, new cljs.core.BlackNode(this__9193.key, this__9193.val, this__9193.left, this__9193.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__9193.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__9194, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__9216 = null;
  var G__9216__0 = function() {
    var this__9195 = this;
    var this__9197 = this;
    return cljs.core.pr_str.call(null, this__9197)
  };
  G__9216 = function() {
    switch(arguments.length) {
      case 0:
        return G__9216__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9216
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__9198 = this;
  var node__9199 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9198.right)) {
    return new cljs.core.RedNode(this__9198.key, this__9198.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9198.left, null), this__9198.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9198.left)) {
      return new cljs.core.RedNode(this__9198.left.key, this__9198.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9198.left.left, null), new cljs.core.BlackNode(this__9198.key, this__9198.val, this__9198.left.right, this__9198.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9199, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__9200 = this;
  var node__9201 = this;
  return new cljs.core.BlackNode(this__9200.key, this__9200.val, this__9200.left, this__9200.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9202 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9203 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9204 = this;
  return cljs.core.list.call(null, this__9204.key, this__9204.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9205 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9206 = this;
  return this__9206.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9207 = this;
  return cljs.core.PersistentVector.fromArray([this__9207.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9208 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9208.key, this__9208.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9209 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9210 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9210.key, this__9210.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9211 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9212 = this;
  if(n === 0) {
    return this__9212.key
  }else {
    if(n === 1) {
      return this__9212.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9213 = this;
  if(n === 0) {
    return this__9213.key
  }else {
    if(n === 1) {
      return this__9213.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9214 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__9220 = comp.call(null, k, tree.key);
    if(c__9220 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__9220 < 0) {
        var ins__9221 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__9221 == null)) {
          return tree.add_left(ins__9221)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__9222 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__9222 == null)) {
            return tree.add_right(ins__9222)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__9225 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9225)) {
            return new cljs.core.RedNode(app__9225.key, app__9225.val, new cljs.core.RedNode(left.key, left.val, left.left, app__9225.left, null), new cljs.core.RedNode(right.key, right.val, app__9225.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__9225, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__9226 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9226)) {
              return new cljs.core.RedNode(app__9226.key, app__9226.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__9226.left, null), new cljs.core.BlackNode(right.key, right.val, app__9226.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__9226, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__9232 = comp.call(null, k, tree.key);
    if(c__9232 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__9232 < 0) {
        var del__9233 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____9234 = !(del__9233 == null);
          if(or__3824__auto____9234) {
            return or__3824__auto____9234
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__9233, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__9233, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__9235 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____9236 = !(del__9235 == null);
            if(or__3824__auto____9236) {
              return or__3824__auto____9236
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__9235)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__9235, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__9239 = tree.key;
  var c__9240 = comp.call(null, k, tk__9239);
  if(c__9240 === 0) {
    return tree.replace(tk__9239, v, tree.left, tree.right)
  }else {
    if(c__9240 < 0) {
      return tree.replace(tk__9239, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__9239, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9243 = this;
  var h__2216__auto____9244 = this__9243.__hash;
  if(!(h__2216__auto____9244 == null)) {
    return h__2216__auto____9244
  }else {
    var h__2216__auto____9245 = cljs.core.hash_imap.call(null, coll);
    this__9243.__hash = h__2216__auto____9245;
    return h__2216__auto____9245
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9246 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9247 = this;
  var n__9248 = coll.entry_at(k);
  if(!(n__9248 == null)) {
    return n__9248.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9249 = this;
  var found__9250 = [null];
  var t__9251 = cljs.core.tree_map_add.call(null, this__9249.comp, this__9249.tree, k, v, found__9250);
  if(t__9251 == null) {
    var found_node__9252 = cljs.core.nth.call(null, found__9250, 0);
    if(cljs.core._EQ_.call(null, v, found_node__9252.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9249.comp, cljs.core.tree_map_replace.call(null, this__9249.comp, this__9249.tree, k, v), this__9249.cnt, this__9249.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9249.comp, t__9251.blacken(), this__9249.cnt + 1, this__9249.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9253 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__9287 = null;
  var G__9287__2 = function(this_sym9254, k) {
    var this__9256 = this;
    var this_sym9254__9257 = this;
    var coll__9258 = this_sym9254__9257;
    return coll__9258.cljs$core$ILookup$_lookup$arity$2(coll__9258, k)
  };
  var G__9287__3 = function(this_sym9255, k, not_found) {
    var this__9256 = this;
    var this_sym9255__9259 = this;
    var coll__9260 = this_sym9255__9259;
    return coll__9260.cljs$core$ILookup$_lookup$arity$3(coll__9260, k, not_found)
  };
  G__9287 = function(this_sym9255, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9287__2.call(this, this_sym9255, k);
      case 3:
        return G__9287__3.call(this, this_sym9255, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9287
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym9241, args9242) {
  var this__9261 = this;
  return this_sym9241.call.apply(this_sym9241, [this_sym9241].concat(args9242.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9262 = this;
  if(!(this__9262.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__9262.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9263 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9264 = this;
  if(this__9264.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9264.tree, false, this__9264.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__9265 = this;
  var this__9266 = this;
  return cljs.core.pr_str.call(null, this__9266)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__9267 = this;
  var coll__9268 = this;
  var t__9269 = this__9267.tree;
  while(true) {
    if(!(t__9269 == null)) {
      var c__9270 = this__9267.comp.call(null, k, t__9269.key);
      if(c__9270 === 0) {
        return t__9269
      }else {
        if(c__9270 < 0) {
          var G__9288 = t__9269.left;
          t__9269 = G__9288;
          continue
        }else {
          if("\ufdd0'else") {
            var G__9289 = t__9269.right;
            t__9269 = G__9289;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9271 = this;
  if(this__9271.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9271.tree, ascending_QMARK_, this__9271.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9272 = this;
  if(this__9272.cnt > 0) {
    var stack__9273 = null;
    var t__9274 = this__9272.tree;
    while(true) {
      if(!(t__9274 == null)) {
        var c__9275 = this__9272.comp.call(null, k, t__9274.key);
        if(c__9275 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__9273, t__9274), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__9275 < 0) {
              var G__9290 = cljs.core.conj.call(null, stack__9273, t__9274);
              var G__9291 = t__9274.left;
              stack__9273 = G__9290;
              t__9274 = G__9291;
              continue
            }else {
              var G__9292 = stack__9273;
              var G__9293 = t__9274.right;
              stack__9273 = G__9292;
              t__9274 = G__9293;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__9275 > 0) {
                var G__9294 = cljs.core.conj.call(null, stack__9273, t__9274);
                var G__9295 = t__9274.right;
                stack__9273 = G__9294;
                t__9274 = G__9295;
                continue
              }else {
                var G__9296 = stack__9273;
                var G__9297 = t__9274.left;
                stack__9273 = G__9296;
                t__9274 = G__9297;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__9273 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__9273, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9276 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9277 = this;
  return this__9277.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9278 = this;
  if(this__9278.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9278.tree, true, this__9278.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9279 = this;
  return this__9279.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9280 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9281 = this;
  return new cljs.core.PersistentTreeMap(this__9281.comp, this__9281.tree, this__9281.cnt, meta, this__9281.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9282 = this;
  return this__9282.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9283 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__9283.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9284 = this;
  var found__9285 = [null];
  var t__9286 = cljs.core.tree_map_remove.call(null, this__9284.comp, this__9284.tree, k, found__9285);
  if(t__9286 == null) {
    if(cljs.core.nth.call(null, found__9285, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9284.comp, null, 0, this__9284.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9284.comp, t__9286.blacken(), this__9284.cnt - 1, this__9284.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__9300 = cljs.core.seq.call(null, keyvals);
    var out__9301 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__9300) {
        var G__9302 = cljs.core.nnext.call(null, in__9300);
        var G__9303 = cljs.core.assoc_BANG_.call(null, out__9301, cljs.core.first.call(null, in__9300), cljs.core.second.call(null, in__9300));
        in__9300 = G__9302;
        out__9301 = G__9303;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9301)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__9304) {
    var keyvals = cljs.core.seq(arglist__9304);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__9305) {
    var keyvals = cljs.core.seq(arglist__9305);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__9309 = [];
    var obj__9310 = {};
    var kvs__9311 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__9311) {
        ks__9309.push(cljs.core.first.call(null, kvs__9311));
        obj__9310[cljs.core.first.call(null, kvs__9311)] = cljs.core.second.call(null, kvs__9311);
        var G__9312 = cljs.core.nnext.call(null, kvs__9311);
        kvs__9311 = G__9312;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__9309, obj__9310)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__9313) {
    var keyvals = cljs.core.seq(arglist__9313);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__9316 = cljs.core.seq.call(null, keyvals);
    var out__9317 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__9316) {
        var G__9318 = cljs.core.nnext.call(null, in__9316);
        var G__9319 = cljs.core.assoc.call(null, out__9317, cljs.core.first.call(null, in__9316), cljs.core.second.call(null, in__9316));
        in__9316 = G__9318;
        out__9317 = G__9319;
        continue
      }else {
        return out__9317
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__9320) {
    var keyvals = cljs.core.seq(arglist__9320);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__9323 = cljs.core.seq.call(null, keyvals);
    var out__9324 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__9323) {
        var G__9325 = cljs.core.nnext.call(null, in__9323);
        var G__9326 = cljs.core.assoc.call(null, out__9324, cljs.core.first.call(null, in__9323), cljs.core.second.call(null, in__9323));
        in__9323 = G__9325;
        out__9324 = G__9326;
        continue
      }else {
        return out__9324
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__9327) {
    var comparator = cljs.core.first(arglist__9327);
    var keyvals = cljs.core.rest(arglist__9327);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__9328_SHARP_, p2__9329_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____9331 = p1__9328_SHARP_;
          if(cljs.core.truth_(or__3824__auto____9331)) {
            return or__3824__auto____9331
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__9329_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__9332) {
    var maps = cljs.core.seq(arglist__9332);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__9340 = function(m, e) {
        var k__9338 = cljs.core.first.call(null, e);
        var v__9339 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__9338)) {
          return cljs.core.assoc.call(null, m, k__9338, f.call(null, cljs.core._lookup.call(null, m, k__9338, null), v__9339))
        }else {
          return cljs.core.assoc.call(null, m, k__9338, v__9339)
        }
      };
      var merge2__9342 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__9340, function() {
          var or__3824__auto____9341 = m1;
          if(cljs.core.truth_(or__3824__auto____9341)) {
            return or__3824__auto____9341
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__9342, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__9343) {
    var f = cljs.core.first(arglist__9343);
    var maps = cljs.core.rest(arglist__9343);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__9348 = cljs.core.ObjMap.EMPTY;
  var keys__9349 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__9349) {
      var key__9350 = cljs.core.first.call(null, keys__9349);
      var entry__9351 = cljs.core._lookup.call(null, map, key__9350, "\ufdd0'user/not-found");
      var G__9352 = cljs.core.not_EQ_.call(null, entry__9351, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__9348, key__9350, entry__9351) : ret__9348;
      var G__9353 = cljs.core.next.call(null, keys__9349);
      ret__9348 = G__9352;
      keys__9349 = G__9353;
      continue
    }else {
      return ret__9348
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9357 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__9357.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9358 = this;
  var h__2216__auto____9359 = this__9358.__hash;
  if(!(h__2216__auto____9359 == null)) {
    return h__2216__auto____9359
  }else {
    var h__2216__auto____9360 = cljs.core.hash_iset.call(null, coll);
    this__9358.__hash = h__2216__auto____9360;
    return h__2216__auto____9360
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9361 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9362 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9362.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__9383 = null;
  var G__9383__2 = function(this_sym9363, k) {
    var this__9365 = this;
    var this_sym9363__9366 = this;
    var coll__9367 = this_sym9363__9366;
    return coll__9367.cljs$core$ILookup$_lookup$arity$2(coll__9367, k)
  };
  var G__9383__3 = function(this_sym9364, k, not_found) {
    var this__9365 = this;
    var this_sym9364__9368 = this;
    var coll__9369 = this_sym9364__9368;
    return coll__9369.cljs$core$ILookup$_lookup$arity$3(coll__9369, k, not_found)
  };
  G__9383 = function(this_sym9364, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9383__2.call(this, this_sym9364, k);
      case 3:
        return G__9383__3.call(this, this_sym9364, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9383
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym9355, args9356) {
  var this__9370 = this;
  return this_sym9355.call.apply(this_sym9355, [this_sym9355].concat(args9356.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9371 = this;
  return new cljs.core.PersistentHashSet(this__9371.meta, cljs.core.assoc.call(null, this__9371.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__9372 = this;
  var this__9373 = this;
  return cljs.core.pr_str.call(null, this__9373)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9374 = this;
  return cljs.core.keys.call(null, this__9374.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9375 = this;
  return new cljs.core.PersistentHashSet(this__9375.meta, cljs.core.dissoc.call(null, this__9375.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9376 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9377 = this;
  var and__3822__auto____9378 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9378) {
    var and__3822__auto____9379 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9379) {
      return cljs.core.every_QMARK_.call(null, function(p1__9354_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9354_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9379
    }
  }else {
    return and__3822__auto____9378
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9380 = this;
  return new cljs.core.PersistentHashSet(meta, this__9380.hash_map, this__9380.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9381 = this;
  return this__9381.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9382 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__9382.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__9384 = cljs.core.count.call(null, items);
  var i__9385 = 0;
  var out__9386 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__9385 < len__9384) {
      var G__9387 = i__9385 + 1;
      var G__9388 = cljs.core.conj_BANG_.call(null, out__9386, items[i__9385]);
      i__9385 = G__9387;
      out__9386 = G__9388;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9386)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__9406 = null;
  var G__9406__2 = function(this_sym9392, k) {
    var this__9394 = this;
    var this_sym9392__9395 = this;
    var tcoll__9396 = this_sym9392__9395;
    if(cljs.core._lookup.call(null, this__9394.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__9406__3 = function(this_sym9393, k, not_found) {
    var this__9394 = this;
    var this_sym9393__9397 = this;
    var tcoll__9398 = this_sym9393__9397;
    if(cljs.core._lookup.call(null, this__9394.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__9406 = function(this_sym9393, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9406__2.call(this, this_sym9393, k);
      case 3:
        return G__9406__3.call(this, this_sym9393, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9406
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym9390, args9391) {
  var this__9399 = this;
  return this_sym9390.call.apply(this_sym9390, [this_sym9390].concat(args9391.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__9400 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__9401 = this;
  if(cljs.core._lookup.call(null, this__9401.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9402 = this;
  return cljs.core.count.call(null, this__9402.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__9403 = this;
  this__9403.transient_map = cljs.core.dissoc_BANG_.call(null, this__9403.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9404 = this;
  this__9404.transient_map = cljs.core.assoc_BANG_.call(null, this__9404.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9405 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__9405.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9409 = this;
  var h__2216__auto____9410 = this__9409.__hash;
  if(!(h__2216__auto____9410 == null)) {
    return h__2216__auto____9410
  }else {
    var h__2216__auto____9411 = cljs.core.hash_iset.call(null, coll);
    this__9409.__hash = h__2216__auto____9411;
    return h__2216__auto____9411
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9412 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9413 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9413.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__9439 = null;
  var G__9439__2 = function(this_sym9414, k) {
    var this__9416 = this;
    var this_sym9414__9417 = this;
    var coll__9418 = this_sym9414__9417;
    return coll__9418.cljs$core$ILookup$_lookup$arity$2(coll__9418, k)
  };
  var G__9439__3 = function(this_sym9415, k, not_found) {
    var this__9416 = this;
    var this_sym9415__9419 = this;
    var coll__9420 = this_sym9415__9419;
    return coll__9420.cljs$core$ILookup$_lookup$arity$3(coll__9420, k, not_found)
  };
  G__9439 = function(this_sym9415, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9439__2.call(this, this_sym9415, k);
      case 3:
        return G__9439__3.call(this, this_sym9415, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9439
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym9407, args9408) {
  var this__9421 = this;
  return this_sym9407.call.apply(this_sym9407, [this_sym9407].concat(args9408.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9422 = this;
  return new cljs.core.PersistentTreeSet(this__9422.meta, cljs.core.assoc.call(null, this__9422.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9423 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__9423.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__9424 = this;
  var this__9425 = this;
  return cljs.core.pr_str.call(null, this__9425)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9426 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__9426.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9427 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__9427.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9428 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9429 = this;
  return cljs.core._comparator.call(null, this__9429.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9430 = this;
  return cljs.core.keys.call(null, this__9430.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9431 = this;
  return new cljs.core.PersistentTreeSet(this__9431.meta, cljs.core.dissoc.call(null, this__9431.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9432 = this;
  return cljs.core.count.call(null, this__9432.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9433 = this;
  var and__3822__auto____9434 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9434) {
    var and__3822__auto____9435 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9435) {
      return cljs.core.every_QMARK_.call(null, function(p1__9389_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9389_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9435
    }
  }else {
    return and__3822__auto____9434
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9436 = this;
  return new cljs.core.PersistentTreeSet(meta, this__9436.tree_map, this__9436.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9437 = this;
  return this__9437.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9438 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__9438.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__9444__delegate = function(keys) {
      var in__9442 = cljs.core.seq.call(null, keys);
      var out__9443 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__9442)) {
          var G__9445 = cljs.core.next.call(null, in__9442);
          var G__9446 = cljs.core.conj_BANG_.call(null, out__9443, cljs.core.first.call(null, in__9442));
          in__9442 = G__9445;
          out__9443 = G__9446;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__9443)
        }
        break
      }
    };
    var G__9444 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9444__delegate.call(this, keys)
    };
    G__9444.cljs$lang$maxFixedArity = 0;
    G__9444.cljs$lang$applyTo = function(arglist__9447) {
      var keys = cljs.core.seq(arglist__9447);
      return G__9444__delegate(keys)
    };
    G__9444.cljs$lang$arity$variadic = G__9444__delegate;
    return G__9444
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__9448) {
    var keys = cljs.core.seq(arglist__9448);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__9450) {
    var comparator = cljs.core.first(arglist__9450);
    var keys = cljs.core.rest(arglist__9450);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__9456 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____9457 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____9457)) {
        var e__9458 = temp__3971__auto____9457;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__9458))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__9456, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__9449_SHARP_) {
      var temp__3971__auto____9459 = cljs.core.find.call(null, smap, p1__9449_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____9459)) {
        var e__9460 = temp__3971__auto____9459;
        return cljs.core.second.call(null, e__9460)
      }else {
        return p1__9449_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__9490 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__9483, seen) {
        while(true) {
          var vec__9484__9485 = p__9483;
          var f__9486 = cljs.core.nth.call(null, vec__9484__9485, 0, null);
          var xs__9487 = vec__9484__9485;
          var temp__3974__auto____9488 = cljs.core.seq.call(null, xs__9487);
          if(temp__3974__auto____9488) {
            var s__9489 = temp__3974__auto____9488;
            if(cljs.core.contains_QMARK_.call(null, seen, f__9486)) {
              var G__9491 = cljs.core.rest.call(null, s__9489);
              var G__9492 = seen;
              p__9483 = G__9491;
              seen = G__9492;
              continue
            }else {
              return cljs.core.cons.call(null, f__9486, step.call(null, cljs.core.rest.call(null, s__9489), cljs.core.conj.call(null, seen, f__9486)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__9490.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__9495 = cljs.core.PersistentVector.EMPTY;
  var s__9496 = s;
  while(true) {
    if(cljs.core.next.call(null, s__9496)) {
      var G__9497 = cljs.core.conj.call(null, ret__9495, cljs.core.first.call(null, s__9496));
      var G__9498 = cljs.core.next.call(null, s__9496);
      ret__9495 = G__9497;
      s__9496 = G__9498;
      continue
    }else {
      return cljs.core.seq.call(null, ret__9495)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____9501 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____9501) {
        return or__3824__auto____9501
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__9502 = x.lastIndexOf("/");
      if(i__9502 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__9502 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____9505 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____9505) {
      return or__3824__auto____9505
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__9506 = x.lastIndexOf("/");
    if(i__9506 > -1) {
      return cljs.core.subs.call(null, x, 2, i__9506)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9513 = cljs.core.ObjMap.EMPTY;
  var ks__9514 = cljs.core.seq.call(null, keys);
  var vs__9515 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____9516 = ks__9514;
      if(and__3822__auto____9516) {
        return vs__9515
      }else {
        return and__3822__auto____9516
      }
    }()) {
      var G__9517 = cljs.core.assoc.call(null, map__9513, cljs.core.first.call(null, ks__9514), cljs.core.first.call(null, vs__9515));
      var G__9518 = cljs.core.next.call(null, ks__9514);
      var G__9519 = cljs.core.next.call(null, vs__9515);
      map__9513 = G__9517;
      ks__9514 = G__9518;
      vs__9515 = G__9519;
      continue
    }else {
      return map__9513
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__9522__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9507_SHARP_, p2__9508_SHARP_) {
        return max_key.call(null, k, p1__9507_SHARP_, p2__9508_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__9522 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9522__delegate.call(this, k, x, y, more)
    };
    G__9522.cljs$lang$maxFixedArity = 3;
    G__9522.cljs$lang$applyTo = function(arglist__9523) {
      var k = cljs.core.first(arglist__9523);
      var x = cljs.core.first(cljs.core.next(arglist__9523));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9523)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9523)));
      return G__9522__delegate(k, x, y, more)
    };
    G__9522.cljs$lang$arity$variadic = G__9522__delegate;
    return G__9522
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__9524__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9520_SHARP_, p2__9521_SHARP_) {
        return min_key.call(null, k, p1__9520_SHARP_, p2__9521_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__9524 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9524__delegate.call(this, k, x, y, more)
    };
    G__9524.cljs$lang$maxFixedArity = 3;
    G__9524.cljs$lang$applyTo = function(arglist__9525) {
      var k = cljs.core.first(arglist__9525);
      var x = cljs.core.first(cljs.core.next(arglist__9525));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9525)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9525)));
      return G__9524__delegate(k, x, y, more)
    };
    G__9524.cljs$lang$arity$variadic = G__9524__delegate;
    return G__9524
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9528 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9528) {
        var s__9529 = temp__3974__auto____9528;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__9529), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__9529)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9532 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9532) {
      var s__9533 = temp__3974__auto____9532;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__9533)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9533), take_while.call(null, pred, cljs.core.rest.call(null, s__9533)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__9535 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__9535.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__9547 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____9548 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____9548)) {
        var vec__9549__9550 = temp__3974__auto____9548;
        var e__9551 = cljs.core.nth.call(null, vec__9549__9550, 0, null);
        var s__9552 = vec__9549__9550;
        if(cljs.core.truth_(include__9547.call(null, e__9551))) {
          return s__9552
        }else {
          return cljs.core.next.call(null, s__9552)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9547, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9553 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____9553)) {
      var vec__9554__9555 = temp__3974__auto____9553;
      var e__9556 = cljs.core.nth.call(null, vec__9554__9555, 0, null);
      var s__9557 = vec__9554__9555;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__9556)) ? s__9557 : cljs.core.next.call(null, s__9557))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__9569 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____9570 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____9570)) {
        var vec__9571__9572 = temp__3974__auto____9570;
        var e__9573 = cljs.core.nth.call(null, vec__9571__9572, 0, null);
        var s__9574 = vec__9571__9572;
        if(cljs.core.truth_(include__9569.call(null, e__9573))) {
          return s__9574
        }else {
          return cljs.core.next.call(null, s__9574)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9569, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9575 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____9575)) {
      var vec__9576__9577 = temp__3974__auto____9575;
      var e__9578 = cljs.core.nth.call(null, vec__9576__9577, 0, null);
      var s__9579 = vec__9576__9577;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__9578)) ? s__9579 : cljs.core.next.call(null, s__9579))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__9580 = this;
  var h__2216__auto____9581 = this__9580.__hash;
  if(!(h__2216__auto____9581 == null)) {
    return h__2216__auto____9581
  }else {
    var h__2216__auto____9582 = cljs.core.hash_coll.call(null, rng);
    this__9580.__hash = h__2216__auto____9582;
    return h__2216__auto____9582
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__9583 = this;
  if(this__9583.step > 0) {
    if(this__9583.start + this__9583.step < this__9583.end) {
      return new cljs.core.Range(this__9583.meta, this__9583.start + this__9583.step, this__9583.end, this__9583.step, null)
    }else {
      return null
    }
  }else {
    if(this__9583.start + this__9583.step > this__9583.end) {
      return new cljs.core.Range(this__9583.meta, this__9583.start + this__9583.step, this__9583.end, this__9583.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__9584 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__9585 = this;
  var this__9586 = this;
  return cljs.core.pr_str.call(null, this__9586)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__9587 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__9588 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__9589 = this;
  if(this__9589.step > 0) {
    if(this__9589.start < this__9589.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__9589.start > this__9589.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__9590 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__9590.end - this__9590.start) / this__9590.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__9591 = this;
  return this__9591.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__9592 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__9592.meta, this__9592.start + this__9592.step, this__9592.end, this__9592.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__9593 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__9594 = this;
  return new cljs.core.Range(meta, this__9594.start, this__9594.end, this__9594.step, this__9594.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__9595 = this;
  return this__9595.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__9596 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9596.start + n * this__9596.step
  }else {
    if(function() {
      var and__3822__auto____9597 = this__9596.start > this__9596.end;
      if(and__3822__auto____9597) {
        return this__9596.step === 0
      }else {
        return and__3822__auto____9597
      }
    }()) {
      return this__9596.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__9598 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9598.start + n * this__9598.step
  }else {
    if(function() {
      var and__3822__auto____9599 = this__9598.start > this__9598.end;
      if(and__3822__auto____9599) {
        return this__9598.step === 0
      }else {
        return and__3822__auto____9599
      }
    }()) {
      return this__9598.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__9600 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9600.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9603 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9603) {
      var s__9604 = temp__3974__auto____9603;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__9604), take_nth.call(null, n, cljs.core.drop.call(null, n, s__9604)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9611 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9611) {
      var s__9612 = temp__3974__auto____9611;
      var fst__9613 = cljs.core.first.call(null, s__9612);
      var fv__9614 = f.call(null, fst__9613);
      var run__9615 = cljs.core.cons.call(null, fst__9613, cljs.core.take_while.call(null, function(p1__9605_SHARP_) {
        return cljs.core._EQ_.call(null, fv__9614, f.call(null, p1__9605_SHARP_))
      }, cljs.core.next.call(null, s__9612)));
      return cljs.core.cons.call(null, run__9615, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__9615), s__9612))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____9630 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____9630) {
        var s__9631 = temp__3971__auto____9630;
        return reductions.call(null, f, cljs.core.first.call(null, s__9631), cljs.core.rest.call(null, s__9631))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9632 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9632) {
        var s__9633 = temp__3974__auto____9632;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__9633)), cljs.core.rest.call(null, s__9633))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__9636 = null;
      var G__9636__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__9636__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__9636__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__9636__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__9636__4 = function() {
        var G__9637__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__9637 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9637__delegate.call(this, x, y, z, args)
        };
        G__9637.cljs$lang$maxFixedArity = 3;
        G__9637.cljs$lang$applyTo = function(arglist__9638) {
          var x = cljs.core.first(arglist__9638);
          var y = cljs.core.first(cljs.core.next(arglist__9638));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9638)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9638)));
          return G__9637__delegate(x, y, z, args)
        };
        G__9637.cljs$lang$arity$variadic = G__9637__delegate;
        return G__9637
      }();
      G__9636 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9636__0.call(this);
          case 1:
            return G__9636__1.call(this, x);
          case 2:
            return G__9636__2.call(this, x, y);
          case 3:
            return G__9636__3.call(this, x, y, z);
          default:
            return G__9636__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9636.cljs$lang$maxFixedArity = 3;
      G__9636.cljs$lang$applyTo = G__9636__4.cljs$lang$applyTo;
      return G__9636
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__9639 = null;
      var G__9639__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__9639__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__9639__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__9639__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__9639__4 = function() {
        var G__9640__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__9640 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9640__delegate.call(this, x, y, z, args)
        };
        G__9640.cljs$lang$maxFixedArity = 3;
        G__9640.cljs$lang$applyTo = function(arglist__9641) {
          var x = cljs.core.first(arglist__9641);
          var y = cljs.core.first(cljs.core.next(arglist__9641));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9641)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9641)));
          return G__9640__delegate(x, y, z, args)
        };
        G__9640.cljs$lang$arity$variadic = G__9640__delegate;
        return G__9640
      }();
      G__9639 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9639__0.call(this);
          case 1:
            return G__9639__1.call(this, x);
          case 2:
            return G__9639__2.call(this, x, y);
          case 3:
            return G__9639__3.call(this, x, y, z);
          default:
            return G__9639__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9639.cljs$lang$maxFixedArity = 3;
      G__9639.cljs$lang$applyTo = G__9639__4.cljs$lang$applyTo;
      return G__9639
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__9642 = null;
      var G__9642__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__9642__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__9642__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__9642__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__9642__4 = function() {
        var G__9643__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__9643 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9643__delegate.call(this, x, y, z, args)
        };
        G__9643.cljs$lang$maxFixedArity = 3;
        G__9643.cljs$lang$applyTo = function(arglist__9644) {
          var x = cljs.core.first(arglist__9644);
          var y = cljs.core.first(cljs.core.next(arglist__9644));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9644)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9644)));
          return G__9643__delegate(x, y, z, args)
        };
        G__9643.cljs$lang$arity$variadic = G__9643__delegate;
        return G__9643
      }();
      G__9642 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9642__0.call(this);
          case 1:
            return G__9642__1.call(this, x);
          case 2:
            return G__9642__2.call(this, x, y);
          case 3:
            return G__9642__3.call(this, x, y, z);
          default:
            return G__9642__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9642.cljs$lang$maxFixedArity = 3;
      G__9642.cljs$lang$applyTo = G__9642__4.cljs$lang$applyTo;
      return G__9642
    }()
  };
  var juxt__4 = function() {
    var G__9645__delegate = function(f, g, h, fs) {
      var fs__9635 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__9646 = null;
        var G__9646__0 = function() {
          return cljs.core.reduce.call(null, function(p1__9616_SHARP_, p2__9617_SHARP_) {
            return cljs.core.conj.call(null, p1__9616_SHARP_, p2__9617_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__9635)
        };
        var G__9646__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__9618_SHARP_, p2__9619_SHARP_) {
            return cljs.core.conj.call(null, p1__9618_SHARP_, p2__9619_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__9635)
        };
        var G__9646__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__9620_SHARP_, p2__9621_SHARP_) {
            return cljs.core.conj.call(null, p1__9620_SHARP_, p2__9621_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__9635)
        };
        var G__9646__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__9622_SHARP_, p2__9623_SHARP_) {
            return cljs.core.conj.call(null, p1__9622_SHARP_, p2__9623_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__9635)
        };
        var G__9646__4 = function() {
          var G__9647__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__9624_SHARP_, p2__9625_SHARP_) {
              return cljs.core.conj.call(null, p1__9624_SHARP_, cljs.core.apply.call(null, p2__9625_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__9635)
          };
          var G__9647 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9647__delegate.call(this, x, y, z, args)
          };
          G__9647.cljs$lang$maxFixedArity = 3;
          G__9647.cljs$lang$applyTo = function(arglist__9648) {
            var x = cljs.core.first(arglist__9648);
            var y = cljs.core.first(cljs.core.next(arglist__9648));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9648)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9648)));
            return G__9647__delegate(x, y, z, args)
          };
          G__9647.cljs$lang$arity$variadic = G__9647__delegate;
          return G__9647
        }();
        G__9646 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__9646__0.call(this);
            case 1:
              return G__9646__1.call(this, x);
            case 2:
              return G__9646__2.call(this, x, y);
            case 3:
              return G__9646__3.call(this, x, y, z);
            default:
              return G__9646__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__9646.cljs$lang$maxFixedArity = 3;
        G__9646.cljs$lang$applyTo = G__9646__4.cljs$lang$applyTo;
        return G__9646
      }()
    };
    var G__9645 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9645__delegate.call(this, f, g, h, fs)
    };
    G__9645.cljs$lang$maxFixedArity = 3;
    G__9645.cljs$lang$applyTo = function(arglist__9649) {
      var f = cljs.core.first(arglist__9649);
      var g = cljs.core.first(cljs.core.next(arglist__9649));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9649)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9649)));
      return G__9645__delegate(f, g, h, fs)
    };
    G__9645.cljs$lang$arity$variadic = G__9645__delegate;
    return G__9645
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__9652 = cljs.core.next.call(null, coll);
        coll = G__9652;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____9651 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____9651) {
          return n > 0
        }else {
          return and__3822__auto____9651
        }
      }())) {
        var G__9653 = n - 1;
        var G__9654 = cljs.core.next.call(null, coll);
        n = G__9653;
        coll = G__9654;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__9656 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__9656), s)) {
    if(cljs.core.count.call(null, matches__9656) === 1) {
      return cljs.core.first.call(null, matches__9656)
    }else {
      return cljs.core.vec.call(null, matches__9656)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__9658 = re.exec(s);
  if(matches__9658 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__9658) === 1) {
      return cljs.core.first.call(null, matches__9658)
    }else {
      return cljs.core.vec.call(null, matches__9658)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__9663 = cljs.core.re_find.call(null, re, s);
  var match_idx__9664 = s.search(re);
  var match_str__9665 = cljs.core.coll_QMARK_.call(null, match_data__9663) ? cljs.core.first.call(null, match_data__9663) : match_data__9663;
  var post_match__9666 = cljs.core.subs.call(null, s, match_idx__9664 + cljs.core.count.call(null, match_str__9665));
  if(cljs.core.truth_(match_data__9663)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__9663, re_seq.call(null, re, post_match__9666))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__9673__9674 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___9675 = cljs.core.nth.call(null, vec__9673__9674, 0, null);
  var flags__9676 = cljs.core.nth.call(null, vec__9673__9674, 1, null);
  var pattern__9677 = cljs.core.nth.call(null, vec__9673__9674, 2, null);
  return new RegExp(pattern__9677, flags__9676)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__9667_SHARP_) {
    return print_one.call(null, p1__9667_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____9687 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____9687)) {
            var and__3822__auto____9691 = function() {
              var G__9688__9689 = obj;
              if(G__9688__9689) {
                if(function() {
                  var or__3824__auto____9690 = G__9688__9689.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____9690) {
                    return or__3824__auto____9690
                  }else {
                    return G__9688__9689.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__9688__9689.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9688__9689)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9688__9689)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____9691)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____9691
            }
          }else {
            return and__3822__auto____9687
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____9692 = !(obj == null);
          if(and__3822__auto____9692) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____9692
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__9693__9694 = obj;
          if(G__9693__9694) {
            if(function() {
              var or__3824__auto____9695 = G__9693__9694.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____9695) {
                return or__3824__auto____9695
              }else {
                return G__9693__9694.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__9693__9694.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9693__9694)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9693__9694)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__9715 = new goog.string.StringBuffer;
  var G__9716__9717 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9716__9717) {
    var string__9718 = cljs.core.first.call(null, G__9716__9717);
    var G__9716__9719 = G__9716__9717;
    while(true) {
      sb__9715.append(string__9718);
      var temp__3974__auto____9720 = cljs.core.next.call(null, G__9716__9719);
      if(temp__3974__auto____9720) {
        var G__9716__9721 = temp__3974__auto____9720;
        var G__9734 = cljs.core.first.call(null, G__9716__9721);
        var G__9735 = G__9716__9721;
        string__9718 = G__9734;
        G__9716__9719 = G__9735;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9722__9723 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9722__9723) {
    var obj__9724 = cljs.core.first.call(null, G__9722__9723);
    var G__9722__9725 = G__9722__9723;
    while(true) {
      sb__9715.append(" ");
      var G__9726__9727 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9724, opts));
      if(G__9726__9727) {
        var string__9728 = cljs.core.first.call(null, G__9726__9727);
        var G__9726__9729 = G__9726__9727;
        while(true) {
          sb__9715.append(string__9728);
          var temp__3974__auto____9730 = cljs.core.next.call(null, G__9726__9729);
          if(temp__3974__auto____9730) {
            var G__9726__9731 = temp__3974__auto____9730;
            var G__9736 = cljs.core.first.call(null, G__9726__9731);
            var G__9737 = G__9726__9731;
            string__9728 = G__9736;
            G__9726__9729 = G__9737;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9732 = cljs.core.next.call(null, G__9722__9725);
      if(temp__3974__auto____9732) {
        var G__9722__9733 = temp__3974__auto____9732;
        var G__9738 = cljs.core.first.call(null, G__9722__9733);
        var G__9739 = G__9722__9733;
        obj__9724 = G__9738;
        G__9722__9725 = G__9739;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__9715
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__9741 = cljs.core.pr_sb.call(null, objs, opts);
  sb__9741.append("\n");
  return[cljs.core.str(sb__9741)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__9760__9761 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9760__9761) {
    var string__9762 = cljs.core.first.call(null, G__9760__9761);
    var G__9760__9763 = G__9760__9761;
    while(true) {
      cljs.core.string_print.call(null, string__9762);
      var temp__3974__auto____9764 = cljs.core.next.call(null, G__9760__9763);
      if(temp__3974__auto____9764) {
        var G__9760__9765 = temp__3974__auto____9764;
        var G__9778 = cljs.core.first.call(null, G__9760__9765);
        var G__9779 = G__9760__9765;
        string__9762 = G__9778;
        G__9760__9763 = G__9779;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9766__9767 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9766__9767) {
    var obj__9768 = cljs.core.first.call(null, G__9766__9767);
    var G__9766__9769 = G__9766__9767;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__9770__9771 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9768, opts));
      if(G__9770__9771) {
        var string__9772 = cljs.core.first.call(null, G__9770__9771);
        var G__9770__9773 = G__9770__9771;
        while(true) {
          cljs.core.string_print.call(null, string__9772);
          var temp__3974__auto____9774 = cljs.core.next.call(null, G__9770__9773);
          if(temp__3974__auto____9774) {
            var G__9770__9775 = temp__3974__auto____9774;
            var G__9780 = cljs.core.first.call(null, G__9770__9775);
            var G__9781 = G__9770__9775;
            string__9772 = G__9780;
            G__9770__9773 = G__9781;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9776 = cljs.core.next.call(null, G__9766__9769);
      if(temp__3974__auto____9776) {
        var G__9766__9777 = temp__3974__auto____9776;
        var G__9782 = cljs.core.first.call(null, G__9766__9777);
        var G__9783 = G__9766__9777;
        obj__9768 = G__9782;
        G__9766__9769 = G__9783;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__9784) {
    var objs = cljs.core.seq(arglist__9784);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__9785) {
    var objs = cljs.core.seq(arglist__9785);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__9786) {
    var objs = cljs.core.seq(arglist__9786);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__9787) {
    var objs = cljs.core.seq(arglist__9787);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__9788) {
    var objs = cljs.core.seq(arglist__9788);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__9789) {
    var objs = cljs.core.seq(arglist__9789);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__9790) {
    var objs = cljs.core.seq(arglist__9790);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__9791) {
    var objs = cljs.core.seq(arglist__9791);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__9792) {
    var fmt = cljs.core.first(arglist__9792);
    var args = cljs.core.rest(arglist__9792);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9793 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9793, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9794 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9794, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9795 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9795, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____9796 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____9796)) {
        var nspc__9797 = temp__3974__auto____9796;
        return[cljs.core.str(nspc__9797), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____9798 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____9798)) {
          var nspc__9799 = temp__3974__auto____9798;
          return[cljs.core.str(nspc__9799), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9800 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9800, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__9802 = function(n, len) {
    var ns__9801 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__9801) < len) {
        var G__9804 = [cljs.core.str("0"), cljs.core.str(ns__9801)].join("");
        ns__9801 = G__9804;
        continue
      }else {
        return ns__9801
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__9802.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__9802.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__9802.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9802.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9802.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__9802.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9803 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9803, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__9805 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__9806 = this;
  var G__9807__9808 = cljs.core.seq.call(null, this__9806.watches);
  if(G__9807__9808) {
    var G__9810__9812 = cljs.core.first.call(null, G__9807__9808);
    var vec__9811__9813 = G__9810__9812;
    var key__9814 = cljs.core.nth.call(null, vec__9811__9813, 0, null);
    var f__9815 = cljs.core.nth.call(null, vec__9811__9813, 1, null);
    var G__9807__9816 = G__9807__9808;
    var G__9810__9817 = G__9810__9812;
    var G__9807__9818 = G__9807__9816;
    while(true) {
      var vec__9819__9820 = G__9810__9817;
      var key__9821 = cljs.core.nth.call(null, vec__9819__9820, 0, null);
      var f__9822 = cljs.core.nth.call(null, vec__9819__9820, 1, null);
      var G__9807__9823 = G__9807__9818;
      f__9822.call(null, key__9821, this$, oldval, newval);
      var temp__3974__auto____9824 = cljs.core.next.call(null, G__9807__9823);
      if(temp__3974__auto____9824) {
        var G__9807__9825 = temp__3974__auto____9824;
        var G__9832 = cljs.core.first.call(null, G__9807__9825);
        var G__9833 = G__9807__9825;
        G__9810__9817 = G__9832;
        G__9807__9818 = G__9833;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__9826 = this;
  return this$.watches = cljs.core.assoc.call(null, this__9826.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__9827 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__9827.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__9828 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__9828.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__9829 = this;
  return this__9829.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9830 = this;
  return this__9830.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__9831 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__9845__delegate = function(x, p__9834) {
      var map__9840__9841 = p__9834;
      var map__9840__9842 = cljs.core.seq_QMARK_.call(null, map__9840__9841) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9840__9841) : map__9840__9841;
      var validator__9843 = cljs.core._lookup.call(null, map__9840__9842, "\ufdd0'validator", null);
      var meta__9844 = cljs.core._lookup.call(null, map__9840__9842, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__9844, validator__9843, null)
    };
    var G__9845 = function(x, var_args) {
      var p__9834 = null;
      if(goog.isDef(var_args)) {
        p__9834 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9845__delegate.call(this, x, p__9834)
    };
    G__9845.cljs$lang$maxFixedArity = 1;
    G__9845.cljs$lang$applyTo = function(arglist__9846) {
      var x = cljs.core.first(arglist__9846);
      var p__9834 = cljs.core.rest(arglist__9846);
      return G__9845__delegate(x, p__9834)
    };
    G__9845.cljs$lang$arity$variadic = G__9845__delegate;
    return G__9845
  }();
  atom = function(x, var_args) {
    var p__9834 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____9850 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____9850)) {
    var validate__9851 = temp__3974__auto____9850;
    if(cljs.core.truth_(validate__9851.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__9852 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__9852, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__9853__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__9853 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9853__delegate.call(this, a, f, x, y, z, more)
    };
    G__9853.cljs$lang$maxFixedArity = 5;
    G__9853.cljs$lang$applyTo = function(arglist__9854) {
      var a = cljs.core.first(arglist__9854);
      var f = cljs.core.first(cljs.core.next(arglist__9854));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9854)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9854))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9854)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9854)))));
      return G__9853__delegate(a, f, x, y, z, more)
    };
    G__9853.cljs$lang$arity$variadic = G__9853__delegate;
    return G__9853
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__9855) {
    var iref = cljs.core.first(arglist__9855);
    var f = cljs.core.first(cljs.core.next(arglist__9855));
    var args = cljs.core.rest(cljs.core.next(arglist__9855));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__9856 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__9856.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9857 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__9857.state, function(p__9858) {
    var map__9859__9860 = p__9858;
    var map__9859__9861 = cljs.core.seq_QMARK_.call(null, map__9859__9860) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9859__9860) : map__9859__9860;
    var curr_state__9862 = map__9859__9861;
    var done__9863 = cljs.core._lookup.call(null, map__9859__9861, "\ufdd0'done", null);
    if(cljs.core.truth_(done__9863)) {
      return curr_state__9862
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__9857.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__9884__9885 = options;
    var map__9884__9886 = cljs.core.seq_QMARK_.call(null, map__9884__9885) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9884__9885) : map__9884__9885;
    var keywordize_keys__9887 = cljs.core._lookup.call(null, map__9884__9886, "\ufdd0'keywordize-keys", null);
    var keyfn__9888 = cljs.core.truth_(keywordize_keys__9887) ? cljs.core.keyword : cljs.core.str;
    var f__9903 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2486__auto____9902 = function iter__9896(s__9897) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__9897__9900 = s__9897;
                    while(true) {
                      if(cljs.core.seq.call(null, s__9897__9900)) {
                        var k__9901 = cljs.core.first.call(null, s__9897__9900);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__9888.call(null, k__9901), thisfn.call(null, x[k__9901])], true), iter__9896.call(null, cljs.core.rest.call(null, s__9897__9900)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2486__auto____9902.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__9903.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__9904) {
    var x = cljs.core.first(arglist__9904);
    var options = cljs.core.rest(arglist__9904);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__9909 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__9913__delegate = function(args) {
      var temp__3971__auto____9910 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__9909), args, null);
      if(cljs.core.truth_(temp__3971__auto____9910)) {
        var v__9911 = temp__3971__auto____9910;
        return v__9911
      }else {
        var ret__9912 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__9909, cljs.core.assoc, args, ret__9912);
        return ret__9912
      }
    };
    var G__9913 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9913__delegate.call(this, args)
    };
    G__9913.cljs$lang$maxFixedArity = 0;
    G__9913.cljs$lang$applyTo = function(arglist__9914) {
      var args = cljs.core.seq(arglist__9914);
      return G__9913__delegate(args)
    };
    G__9913.cljs$lang$arity$variadic = G__9913__delegate;
    return G__9913
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__9916 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__9916)) {
        var G__9917 = ret__9916;
        f = G__9917;
        continue
      }else {
        return ret__9916
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__9918__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__9918 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9918__delegate.call(this, f, args)
    };
    G__9918.cljs$lang$maxFixedArity = 1;
    G__9918.cljs$lang$applyTo = function(arglist__9919) {
      var f = cljs.core.first(arglist__9919);
      var args = cljs.core.rest(arglist__9919);
      return G__9918__delegate(f, args)
    };
    G__9918.cljs$lang$arity$variadic = G__9918__delegate;
    return G__9918
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__9921 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__9921, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__9921, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____9930 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____9930) {
      return or__3824__auto____9930
    }else {
      var or__3824__auto____9931 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____9931) {
        return or__3824__auto____9931
      }else {
        var and__3822__auto____9932 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____9932) {
          var and__3822__auto____9933 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____9933) {
            var and__3822__auto____9934 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____9934) {
              var ret__9935 = true;
              var i__9936 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____9937 = cljs.core.not.call(null, ret__9935);
                  if(or__3824__auto____9937) {
                    return or__3824__auto____9937
                  }else {
                    return i__9936 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__9935
                }else {
                  var G__9938 = isa_QMARK_.call(null, h, child.call(null, i__9936), parent.call(null, i__9936));
                  var G__9939 = i__9936 + 1;
                  ret__9935 = G__9938;
                  i__9936 = G__9939;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____9934
            }
          }else {
            return and__3822__auto____9933
          }
        }else {
          return and__3822__auto____9932
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728))))].join(""));
    }
    var tp__9948 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__9949 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__9950 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__9951 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____9952 = cljs.core.contains_QMARK_.call(null, tp__9948.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__9950.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__9950.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__9948, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__9951.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__9949, parent, ta__9950), "\ufdd0'descendants":tf__9951.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, 
      h), parent, ta__9950, tag, td__9949)})
    }();
    if(cljs.core.truth_(or__3824__auto____9952)) {
      return or__3824__auto____9952
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__9957 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__9958 = cljs.core.truth_(parentMap__9957.call(null, tag)) ? cljs.core.disj.call(null, parentMap__9957.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__9959 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__9958)) ? cljs.core.assoc.call(null, parentMap__9957, tag, childsParents__9958) : cljs.core.dissoc.call(null, parentMap__9957, tag);
    var deriv_seq__9960 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__9940_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__9940_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__9940_SHARP_), cljs.core.second.call(null, p1__9940_SHARP_)))
    }, cljs.core.seq.call(null, newParents__9959)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__9957.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__9941_SHARP_, p2__9942_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__9941_SHARP_, p2__9942_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__9960))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__9968 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____9970 = cljs.core.truth_(function() {
    var and__3822__auto____9969 = xprefs__9968;
    if(cljs.core.truth_(and__3822__auto____9969)) {
      return xprefs__9968.call(null, y)
    }else {
      return and__3822__auto____9969
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____9970)) {
    return or__3824__auto____9970
  }else {
    var or__3824__auto____9972 = function() {
      var ps__9971 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__9971) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__9971), prefer_table))) {
          }else {
          }
          var G__9975 = cljs.core.rest.call(null, ps__9971);
          ps__9971 = G__9975;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____9972)) {
      return or__3824__auto____9972
    }else {
      var or__3824__auto____9974 = function() {
        var ps__9973 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__9973) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__9973), y, prefer_table))) {
            }else {
            }
            var G__9976 = cljs.core.rest.call(null, ps__9973);
            ps__9973 = G__9976;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____9974)) {
        return or__3824__auto____9974
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____9978 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____9978)) {
    return or__3824__auto____9978
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__9996 = cljs.core.reduce.call(null, function(be, p__9988) {
    var vec__9989__9990 = p__9988;
    var k__9991 = cljs.core.nth.call(null, vec__9989__9990, 0, null);
    var ___9992 = cljs.core.nth.call(null, vec__9989__9990, 1, null);
    var e__9993 = vec__9989__9990;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__9991)) {
      var be2__9995 = cljs.core.truth_(function() {
        var or__3824__auto____9994 = be == null;
        if(or__3824__auto____9994) {
          return or__3824__auto____9994
        }else {
          return cljs.core.dominates.call(null, k__9991, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__9993 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__9995), k__9991, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__9991), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__9995)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__9995
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__9996)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__9996));
      return cljs.core.second.call(null, best_entry__9996)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____10001 = mf;
    if(and__3822__auto____10001) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____10001
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2387__auto____10002 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10003 = cljs.core._reset[goog.typeOf(x__2387__auto____10002)];
      if(or__3824__auto____10003) {
        return or__3824__auto____10003
      }else {
        var or__3824__auto____10004 = cljs.core._reset["_"];
        if(or__3824__auto____10004) {
          return or__3824__auto____10004
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____10009 = mf;
    if(and__3822__auto____10009) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____10009
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2387__auto____10010 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10011 = cljs.core._add_method[goog.typeOf(x__2387__auto____10010)];
      if(or__3824__auto____10011) {
        return or__3824__auto____10011
      }else {
        var or__3824__auto____10012 = cljs.core._add_method["_"];
        if(or__3824__auto____10012) {
          return or__3824__auto____10012
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10017 = mf;
    if(and__3822__auto____10017) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____10017
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2387__auto____10018 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10019 = cljs.core._remove_method[goog.typeOf(x__2387__auto____10018)];
      if(or__3824__auto____10019) {
        return or__3824__auto____10019
      }else {
        var or__3824__auto____10020 = cljs.core._remove_method["_"];
        if(or__3824__auto____10020) {
          return or__3824__auto____10020
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____10025 = mf;
    if(and__3822__auto____10025) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____10025
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2387__auto____10026 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10027 = cljs.core._prefer_method[goog.typeOf(x__2387__auto____10026)];
      if(or__3824__auto____10027) {
        return or__3824__auto____10027
      }else {
        var or__3824__auto____10028 = cljs.core._prefer_method["_"];
        if(or__3824__auto____10028) {
          return or__3824__auto____10028
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10033 = mf;
    if(and__3822__auto____10033) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____10033
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2387__auto____10034 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10035 = cljs.core._get_method[goog.typeOf(x__2387__auto____10034)];
      if(or__3824__auto____10035) {
        return or__3824__auto____10035
      }else {
        var or__3824__auto____10036 = cljs.core._get_method["_"];
        if(or__3824__auto____10036) {
          return or__3824__auto____10036
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____10041 = mf;
    if(and__3822__auto____10041) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____10041
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2387__auto____10042 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10043 = cljs.core._methods[goog.typeOf(x__2387__auto____10042)];
      if(or__3824__auto____10043) {
        return or__3824__auto____10043
      }else {
        var or__3824__auto____10044 = cljs.core._methods["_"];
        if(or__3824__auto____10044) {
          return or__3824__auto____10044
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____10049 = mf;
    if(and__3822__auto____10049) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____10049
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2387__auto____10050 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10051 = cljs.core._prefers[goog.typeOf(x__2387__auto____10050)];
      if(or__3824__auto____10051) {
        return or__3824__auto____10051
      }else {
        var or__3824__auto____10052 = cljs.core._prefers["_"];
        if(or__3824__auto____10052) {
          return or__3824__auto____10052
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____10057 = mf;
    if(and__3822__auto____10057) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____10057
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2387__auto____10058 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10059 = cljs.core._dispatch[goog.typeOf(x__2387__auto____10058)];
      if(or__3824__auto____10059) {
        return or__3824__auto____10059
      }else {
        var or__3824__auto____10060 = cljs.core._dispatch["_"];
        if(or__3824__auto____10060) {
          return or__3824__auto____10060
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10063 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__10064 = cljs.core._get_method.call(null, mf, dispatch_val__10063);
  if(cljs.core.truth_(target_fn__10064)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__10063)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__10064, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10065 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__10066 = this;
  cljs.core.swap_BANG_.call(null, this__10066.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10066.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10066.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10066.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10067 = this;
  cljs.core.swap_BANG_.call(null, this__10067.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__10067.method_cache, this__10067.method_table, this__10067.cached_hierarchy, this__10067.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10068 = this;
  cljs.core.swap_BANG_.call(null, this__10068.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__10068.method_cache, this__10068.method_table, this__10068.cached_hierarchy, this__10068.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10069 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10069.cached_hierarchy), cljs.core.deref.call(null, this__10069.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__10069.method_cache, this__10069.method_table, this__10069.cached_hierarchy, this__10069.hierarchy)
  }
  var temp__3971__auto____10070 = cljs.core.deref.call(null, this__10069.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____10070)) {
    var target_fn__10071 = temp__3971__auto____10070;
    return target_fn__10071
  }else {
    var temp__3971__auto____10072 = cljs.core.find_and_cache_best_method.call(null, this__10069.name, dispatch_val, this__10069.hierarchy, this__10069.method_table, this__10069.prefer_table, this__10069.method_cache, this__10069.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____10072)) {
      var target_fn__10073 = temp__3971__auto____10072;
      return target_fn__10073
    }else {
      return cljs.core.deref.call(null, this__10069.method_table).call(null, this__10069.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10074 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__10074.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10074.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__10074.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__10074.method_cache, this__10074.method_table, this__10074.cached_hierarchy, this__10074.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10075 = this;
  return cljs.core.deref.call(null, this__10075.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10076 = this;
  return cljs.core.deref.call(null, this__10076.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10077 = this;
  return cljs.core.do_dispatch.call(null, mf, this__10077.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10079__delegate = function(_, args) {
    var self__10078 = this;
    return cljs.core._dispatch.call(null, self__10078, args)
  };
  var G__10079 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10079__delegate.call(this, _, args)
  };
  G__10079.cljs$lang$maxFixedArity = 1;
  G__10079.cljs$lang$applyTo = function(arglist__10080) {
    var _ = cljs.core.first(arglist__10080);
    var args = cljs.core.rest(arglist__10080);
    return G__10079__delegate(_, args)
  };
  G__10079.cljs$lang$arity$variadic = G__10079__delegate;
  return G__10079
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10081 = this;
  return cljs.core._dispatch.call(null, self__10081, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10082 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10084, _) {
  var this__10083 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__10083.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10085 = this;
  var and__3822__auto____10086 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____10086) {
    return this__10085.uuid === other.uuid
  }else {
    return and__3822__auto____10086
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__10087 = this;
  var this__10088 = this;
  return cljs.core.pr_str.call(null, this__10088)
};
cljs.core.UUID;
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.userAgent.isDocumentModeCache_ = {};
goog.userAgent.isDocumentMode = function(documentMode) {
  return goog.userAgent.isDocumentModeCache_[documentMode] || (goog.userAgent.isDocumentModeCache_[documentMode] = goog.userAgent.IE && document.documentMode && document.documentMode >= documentMode)
};
goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isDocumentMode(9) || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
goog.provide("goog.dom.TagName");
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", DD:"DD", DEL:"DEL", DFN:"DFN", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", FIELDSET:"FIELDSET", FONT:"FONT", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET", 
H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", MAP:"MAP", MENU:"MENU", META:"META", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", P:"P", PARAM:"PARAM", PRE:"PRE", Q:"Q", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SELECT:"SELECT", SMALL:"SMALL", SPAN:"SPAN", STRIKE:"STRIKE", 
STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUP:"SUP", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TITLE:"TITLE", TR:"TR", TT:"TT", U:"U", UL:"UL", VAR:"VAR"};
goog.provide("goog.dom.classes");
goog.require("goog.array");
goog.dom.classes.set = function(element, className) {
  element.className = className
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return className && typeof className.split == "function" ? className.split(/\s+/) : []
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.add_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.remove_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.add_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < args.length;i++) {
    if(!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.remove_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < classes.length;i++) {
    if(goog.array.contains(args, classes[i])) {
      goog.array.splice(classes, i--, 1);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);
  var removed = false;
  for(var i = 0;i < classes.length;i++) {
    if(classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true
    }
  }
  if(removed) {
    classes.push(toClass);
    element.className = classes.join(" ")
  }
  return removed
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if(goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove)
  }else {
    if(goog.isArray(classesToRemove)) {
      goog.dom.classes.remove_(classes, classesToRemove)
    }
  }
  if(goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd)
  }else {
    if(goog.isArray(classesToAdd)) {
      goog.dom.classes.add_(classes, classesToAdd)
    }
  }
  element.className = classes.join(" ")
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className)
};
goog.dom.classes.enable = function(element, className, enabled) {
  if(enabled) {
    goog.dom.classes.add(element, className)
  }else {
    goog.dom.classes.remove(element, className)
  }
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add
};
goog.provide("goog.math.Coordinate");
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y)
};
if(goog.DEBUG) {
  goog.math.Coordinate.prototype.toString = function() {
    return"(" + this.x + ", " + this.y + ")"
  }
}
goog.math.Coordinate.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.x == b.x && a.y == b.y
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy)
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
};
goog.provide("goog.math.Size");
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height
};
goog.math.Size.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.width == b.width && a.height == b.height
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height)
};
if(goog.DEBUG) {
  goog.math.Size.prototype.toString = function() {
    return"(" + this.width + " x " + this.height + ")"
  }
}
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height)
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height)
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height
};
goog.math.Size.prototype.perimeter = function() {
  return(this.width + this.height) * 2
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area()
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s)
};
goog.provide("goog.dom");
goog.provide("goog.dom.DomHelper");
goog.provide("goog.dom.NodeType");
goog.require("goog.array");
goog.require("goog.dom.BrowserFeature");
goog.require("goog.dom.TagName");
goog.require("goog.dom.classes");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.ASSUME_QUIRKS_MODE = false;
goog.dom.ASSUME_STANDARDS_MODE = false;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
};
goog.dom.defaultDomHelper_;
goog.dom.getDocument = function() {
  return document
};
goog.dom.getElement = function(element) {
  return goog.isString(element) ? document.getElementById(element) : element
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el)
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if(goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll("." + className)
  }else {
    if(parent.getElementsByClassName) {
      return parent.getElementsByClassName(className)
    }
  }
  return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if(goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector("." + className)
  }else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0]
  }
  return retVal || null
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return parent.querySelectorAll && parent.querySelector && (!goog.userAgent.WEBKIT || goog.dom.isCss1CompatMode_(document) || goog.userAgent.isVersion("528"))
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tagName = opt_tag && opt_tag != "*" ? opt_tag.toUpperCase() : "";
  if(goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    var query = tagName + (opt_class ? "." + opt_class : "");
    return parent.querySelectorAll(query)
  }
  if(opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if(tagName) {
      var arrayLike = {};
      var len = 0;
      for(var i = 0, el;el = els[i];i++) {
        if(tagName == el.nodeName) {
          arrayLike[len++] = el
        }
      }
      arrayLike.length = len;
      return arrayLike
    }else {
      return els
    }
  }
  var els = parent.getElementsByTagName(tagName || "*");
  if(opt_class) {
    var arrayLike = {};
    var len = 0;
    for(var i = 0, el;el = els[i];i++) {
      var className = el.className;
      if(typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el
      }
    }
    arrayLike.length = len;
    return arrayLike
  }else {
    return els
  }
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if(key == "style") {
      element.style.cssText = val
    }else {
      if(key == "class") {
        element.className = val
      }else {
        if(key == "for") {
          element.htmlFor = val
        }else {
          if(key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
            element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val)
          }else {
            if(goog.string.startsWith(key, "aria-")) {
              element.setAttribute(key, val)
            }else {
              element[key] = val
            }
          }
        }
      }
    }
  })
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {"cellpadding":"cellPadding", "cellspacing":"cellSpacing", "colspan":"colSpan", "rowspan":"rowSpan", "valign":"vAlign", "height":"height", "width":"width", "usemap":"useMap", "frameborder":"frameBorder", "maxlength":"maxLength", "type":"type"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window)
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("500") && !goog.userAgent.MOBILE) {
    if(typeof win.innerHeight == "undefined") {
      win = window
    }
    var innerHeight = win.innerHeight;
    var scrollHeight = win.document.documentElement.scrollHeight;
    if(win == win.top) {
      if(scrollHeight < innerHeight) {
        innerHeight -= 15
      }
    }
    return new goog.math.Size(win.innerWidth, innerHeight)
  }
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight)
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window)
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document;
  var height = 0;
  if(doc) {
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if(goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight
    }else {
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if(docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight
      }
      if(sh > vh) {
        height = sh > oh ? sh : oh
      }else {
        height = sh < oh ? sh : oh
      }
    }
  }
  return height
};
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll()
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document)
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop)
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document)
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments)
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];
  if(!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ["<", tagName];
    if(attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"')
    }
    if(attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      attributes = clone;
      delete attributes.type
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("")
  }
  var element = doc.createElement(tagName);
  if(attributes) {
    if(goog.isString(attributes)) {
      element.className = attributes
    }else {
      if(goog.isArray(attributes)) {
        goog.dom.classes.add.apply(null, [element].concat(attributes))
      }else {
        goog.dom.setProperties(element, attributes)
      }
    }
  }
  if(args.length > 2) {
    goog.dom.append_(doc, element, args, 2)
  }
  return element
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    if(child) {
      parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
    }
  }
  for(var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    if(goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.clone(arg) : arg, childHandler)
    }else {
      childHandler(arg)
    }
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return document.createElement(name)
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content)
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ["<tr>"];
  for(var i = 0;i < columns;i++) {
    rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>")
  }
  rowHtml.push("</tr>");
  rowHtml = rowHtml.join("");
  var totalHtml = ["<table>"];
  for(i = 0;i < rows;i++) {
    totalHtml.push(rowHtml)
  }
  totalHtml.push("</table>");
  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join("");
  return elem.removeChild(elem.firstChild)
};
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString)
};
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement("div");
  if(goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = "<br>" + htmlString;
    tempDiv.removeChild(tempDiv.firstChild)
  }else {
    tempDiv.innerHTML = htmlString
  }
  if(tempDiv.childNodes.length == 1) {
    return tempDiv.removeChild(tempDiv.firstChild)
  }else {
    var fragment = doc.createDocumentFragment();
    while(tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    return fragment
  }
};
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document)
};
goog.dom.isCss1CompatMode_ = function(doc) {
  if(goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE
  }
  return doc.compatMode == "CSS1Compat"
};
goog.dom.canHaveChildren = function(node) {
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false
  }
  switch(node.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.STYLE:
      return false
  }
  return true
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child)
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1)
};
goog.dom.removeChildren = function(node) {
  var child;
  while(child = node.firstChild) {
    node.removeChild(child)
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode)
  }
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
  }
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null)
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if(parent) {
    parent.replaceChild(newNode, oldNode)
  }
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if(parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if(element.removeNode) {
      return element.removeNode(false)
    }else {
      while(child = element.firstChild) {
        parent.insertBefore(child, element)
      }
      return goog.dom.removeNode(element)
    }
  }
};
goog.dom.getChildren = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) {
    return element.children
  }
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT
  })
};
goog.dom.getFirstElementChild = function(node) {
  if(node.firstElementChild != undefined) {
    return node.firstElementChild
  }
  return goog.dom.getNextElementNode_(node.firstChild, true)
};
goog.dom.getLastElementChild = function(node) {
  if(node.lastElementChild != undefined) {
    return node.lastElementChild
  }
  return goog.dom.getNextElementNode_(node.lastChild, false)
};
goog.dom.getNextElementSibling = function(node) {
  if(node.nextElementSibling != undefined) {
    return node.nextElementSibling
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true)
};
goog.dom.getPreviousElementSibling = function(node) {
  if(node.previousElementSibling != undefined) {
    return node.previousElementSibling
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false)
};
goog.dom.getNextElementNode_ = function(node, forward) {
  while(node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling
  }
  return node
};
goog.dom.getNextNode = function(node) {
  if(!node) {
    return null
  }
  if(node.firstChild) {
    return node.firstChild
  }
  while(node && !node.nextSibling) {
    node = node.parentNode
  }
  return node ? node.nextSibling : null
};
goog.dom.getPreviousNode = function(node) {
  if(!node) {
    return null
  }
  if(!node.previousSibling) {
    return node.parentNode
  }
  node = node.previousSibling;
  while(node && node.lastChild) {
    node = node.lastChild
  }
  return node
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0
};
goog.dom.isElement = function(obj) {
  return goog.isObject(obj) && obj.nodeType == goog.dom.NodeType.ELEMENT
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj["window"] == obj
};
goog.dom.contains = function(parent, descendant) {
  if(parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant)
  }
  if(typeof parent.compareDocumentPosition != "undefined") {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16)
  }
  while(descendant && parent != descendant) {
    descendant = descendant.parentNode
  }
  return descendant == parent
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if(node1 == node2) {
    return 0
  }
  if(node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1
  }
  if("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if(isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex
    }else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;
      if(parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2)
      }
      if(!isElement1 && goog.dom.contains(parent1, node2)) {
        return-1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2)
      }
      if(!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1)
      }
      return(isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex)
    }
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);
  return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2)
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if(parent == node) {
    return-1
  }
  var sibling = node;
  while(sibling.parentNode != parent) {
    sibling = sibling.parentNode
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode)
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while(s = s.previousSibling) {
    if(s == node1) {
      return-1
    }
  }
  return 1
};
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if(!count) {
    return null
  }else {
    if(count == 1) {
      return arguments[0]
    }
  }
  var paths = [];
  var minLength = Infinity;
  for(i = 0;i < count;i++) {
    var ancestors = [];
    var node = arguments[i];
    while(node) {
      ancestors.unshift(node);
      node = node.parentNode
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length)
  }
  var output = null;
  for(i = 0;i < minLength;i++) {
    var first = paths[0][i];
    for(var j = 1;j < count;j++) {
      if(first != paths[j][i]) {
        return output
      }
    }
    output = first
  }
  return output
};
goog.dom.getOwnerDocument = function(node) {
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document
};
goog.dom.getFrameContentDocument = function(frame) {
  var doc = frame.contentDocument || frame.contentWindow.document;
  return doc
};
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame))
};
goog.dom.setTextContent = function(element, text) {
  if("textContent" in element) {
    element.textContent = text
  }else {
    if(element.firstChild && element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
      while(element.lastChild != element.firstChild) {
        element.removeChild(element.lastChild)
      }
      element.firstChild.data = text
    }else {
      goog.dom.removeChildren(element);
      var doc = goog.dom.getOwnerDocument(element);
      element.appendChild(doc.createTextNode(text))
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  if("outerHTML" in element) {
    return element.outerHTML
  }else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement("div");
    div.appendChild(element.cloneNode(true));
    return div.innerHTML
  }
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if(root != null) {
    var child = root.firstChild;
    while(child) {
      if(p(child)) {
        rv.push(child);
        if(findOne) {
          return true
        }
      }
      if(goog.dom.findNodes_(child, p, rv, findOne)) {
        return true
      }
      child = child.nextSibling
    }
  }
  return false
};
goog.dom.TAGS_TO_IGNORE_ = {"SCRIPT":1, "STYLE":1, "HEAD":1, "IFRAME":1, "OBJECT":1};
goog.dom.PREDEFINED_TAG_VALUES_ = {"IMG":" ", "BR":"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  var attrNode = element.getAttributeNode("tabindex");
  if(attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && index >= 0 && index < 32768
  }
  return false
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if(enable) {
    element.tabIndex = 0
  }else {
    element.tabIndex = -1;
    element.removeAttribute("tabIndex")
  }
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if(goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText)
  }else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join("")
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  if(!goog.dom.BrowserFeature.CAN_USE_INNER_TEXT) {
    textContent = textContent.replace(/ +/g, " ")
  }
  if(textContent != " ") {
    textContent = textContent.replace(/^\s*/, "")
  }
  return textContent
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);
  return buf.join("")
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if(node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
  }else {
    if(node.nodeType == goog.dom.NodeType.TEXT) {
      if(normalizeWhitespace) {
        buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""))
      }else {
        buf.push(node.nodeValue)
      }
    }else {
      if(node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName])
      }else {
        var child = node.firstChild;
        while(child) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace);
          child = child.nextSibling
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while(node && node != root) {
    var cur = node;
    while(cur = cur.previousSibling) {
      buf.unshift(goog.dom.getTextContent(cur))
    }
    node = node.parentNode
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while(stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if(cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    }else {
      if(cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length
      }else {
        if(cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length
        }else {
          for(var i = cur.childNodes.length - 1;i >= 0;i--) {
            stack.push(cur.childNodes[i])
          }
        }
      }
    }
  }
  if(goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur
  }
  return cur
};
goog.dom.isNodeList = function(val) {
  if(val && typeof val.length == "number") {
    if(goog.isObject(val)) {
      return typeof val.item == "function" || typeof val.item == "string"
    }else {
      if(goog.isFunction(val)) {
        return typeof val.item == "function"
      }
    }
  }
  return false
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return(!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class))
  }, true)
};
goog.dom.getAncestorByClass = function(element, opt_class) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, opt_class)
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if(!opt_includeNode) {
    element = element.parentNode
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while(element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if(matcher(element)) {
      return element
    }
    element = element.parentNode;
    steps++
  }
  return null
};
goog.dom.getActiveElement = function(doc) {
  try {
    return doc && doc.activeElement
  }catch(e) {
  }
  return null
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || goog.global.document || document
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  if(goog.isString(element)) {
    return this.document_.getElementById(element)
  }else {
    return element
  }
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el)
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc)
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc)
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow())
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow())
};
goog.dom.Appendable;
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments)
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name)
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content)
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString)
};
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_)
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_)
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestorByClass = goog.dom.getAncestorByClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.provide("goog.events.EventType");
goog.require("goog.userAgent");
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", 
BEFORECOPY:"beforecopy", BEFORECUT:"beforecut", BEFOREPASTE:"beforepaste", MESSAGE:"message", CONNECT:"connect", TRANSITIONEND:goog.userAgent.WEBKIT ? "webkitTransitionEnd" : goog.userAgent.OPERA ? "oTransitionEnd" : "transitionend"};
goog.provide("goog.math");
goog.require("goog.array");
goog.math.randomInt = function(a) {
  return Math.floor(Math.random() * a)
};
goog.math.uniformRandom = function(a, b) {
  return a + Math.random() * (b - a)
};
goog.math.clamp = function(value, min, max) {
  return Math.min(Math.max(value, min), max)
};
goog.math.modulo = function(a, b) {
  var r = a % b;
  return r * b < 0 ? r + b : r
};
goog.math.lerp = function(a, b, x) {
  return a + x * (b - a)
};
goog.math.nearlyEquals = function(a, b, opt_tolerance) {
  return Math.abs(a - b) <= (opt_tolerance || 1.0E-6)
};
goog.math.standardAngle = function(angle) {
  return goog.math.modulo(angle, 360)
};
goog.math.toRadians = function(angleDegrees) {
  return angleDegrees * Math.PI / 180
};
goog.math.toDegrees = function(angleRadians) {
  return angleRadians * 180 / Math.PI
};
goog.math.angleDx = function(degrees, radius) {
  return radius * Math.cos(goog.math.toRadians(degrees))
};
goog.math.angleDy = function(degrees, radius) {
  return radius * Math.sin(goog.math.toRadians(degrees))
};
goog.math.angle = function(x1, y1, x2, y2) {
  return goog.math.standardAngle(goog.math.toDegrees(Math.atan2(y2 - y1, x2 - x1)))
};
goog.math.angleDifference = function(startAngle, endAngle) {
  var d = goog.math.standardAngle(endAngle) - goog.math.standardAngle(startAngle);
  if(d > 180) {
    d = d - 360
  }else {
    if(d <= -180) {
      d = 360 + d
    }
  }
  return d
};
goog.math.sign = function(x) {
  return x == 0 ? 0 : x < 0 ? -1 : 1
};
goog.math.longestCommonSubsequence = function(array1, array2, opt_compareFn, opt_collectorFn) {
  var compare = opt_compareFn || function(a, b) {
    return a == b
  };
  var collect = opt_collectorFn || function(i1, i2) {
    return array1[i1]
  };
  var length1 = array1.length;
  var length2 = array2.length;
  var arr = [];
  for(var i = 0;i < length1 + 1;i++) {
    arr[i] = [];
    arr[i][0] = 0
  }
  for(var j = 0;j < length2 + 1;j++) {
    arr[0][j] = 0
  }
  for(i = 1;i <= length1;i++) {
    for(j = 1;j <= length1;j++) {
      if(compare(array1[i - 1], array2[j - 1])) {
        arr[i][j] = arr[i - 1][j - 1] + 1
      }else {
        arr[i][j] = Math.max(arr[i - 1][j], arr[i][j - 1])
      }
    }
  }
  var result = [];
  var i = length1, j = length2;
  while(i > 0 && j > 0) {
    if(compare(array1[i - 1], array2[j - 1])) {
      result.unshift(collect(i - 1, j - 1));
      i--;
      j--
    }else {
      if(arr[i - 1][j] > arr[i][j - 1]) {
        i--
      }else {
        j--
      }
    }
  }
  return result
};
goog.math.sum = function(var_args) {
  return goog.array.reduce(arguments, function(sum, value) {
    return sum + value
  }, 0)
};
goog.math.average = function(var_args) {
  return goog.math.sum.apply(null, arguments) / arguments.length
};
goog.math.standardDeviation = function(var_args) {
  var sampleSize = arguments.length;
  if(sampleSize < 2) {
    return 0
  }
  var mean = goog.math.average.apply(null, arguments);
  var variance = goog.math.sum.apply(null, goog.array.map(arguments, function(val) {
    return Math.pow(val - mean, 2)
  })) / (sampleSize - 1);
  return Math.sqrt(variance)
};
goog.math.isInt = function(num) {
  return isFinite(num) && num % 1 == 0
};
goog.math.isFiniteNumber = function(num) {
  return isFinite(num) && !isNaN(num)
};
goog.provide("goog.graphics.Path");
goog.provide("goog.graphics.Path.Segment");
goog.require("goog.array");
goog.require("goog.math");
goog.graphics.Path = function() {
  this.segments_ = [];
  this.count_ = [];
  this.arguments_ = []
};
goog.graphics.Path.prototype.closePoint_ = null;
goog.graphics.Path.prototype.currentPoint_ = null;
goog.graphics.Path.prototype.simple_ = true;
goog.graphics.Path.Segment = {MOVETO:0, LINETO:1, CURVETO:2, ARCTO:3, CLOSE:4};
goog.graphics.Path.segmentArgCounts_ = function() {
  var counts = [];
  counts[goog.graphics.Path.Segment.MOVETO] = 2;
  counts[goog.graphics.Path.Segment.LINETO] = 2;
  counts[goog.graphics.Path.Segment.CURVETO] = 6;
  counts[goog.graphics.Path.Segment.ARCTO] = 6;
  counts[goog.graphics.Path.Segment.CLOSE] = 0;
  return counts
}();
goog.graphics.Path.getSegmentCount = function(segment) {
  return goog.graphics.Path.segmentArgCounts_[segment]
};
goog.graphics.Path.prototype.appendPath = function(path) {
  if(path.currentPoint_) {
    Array.prototype.push.apply(this.segments_, path.segments_);
    Array.prototype.push.apply(this.count_, path.count_);
    Array.prototype.push.apply(this.arguments_, path.arguments_);
    this.currentPoint_ = path.currentPoint_.concat();
    this.closePoint_ = path.closePoint_.concat();
    this.simple_ = this.simple_ && path.simple_
  }
  return this
};
goog.graphics.Path.prototype.clear = function() {
  this.segments_.length = 0;
  this.count_.length = 0;
  this.arguments_.length = 0;
  delete this.closePoint_;
  delete this.currentPoint_;
  delete this.simple_;
  return this
};
goog.graphics.Path.prototype.moveTo = function(x, y) {
  if(goog.array.peek(this.segments_) == goog.graphics.Path.Segment.MOVETO) {
    this.arguments_.length -= 2
  }else {
    this.segments_.push(goog.graphics.Path.Segment.MOVETO);
    this.count_.push(1)
  }
  this.arguments_.push(x, y);
  this.currentPoint_ = this.closePoint_ = [x, y];
  return this
};
goog.graphics.Path.prototype.lineTo = function(var_args) {
  var lastSegment = goog.array.peek(this.segments_);
  if(lastSegment == null) {
    throw Error("Path cannot start with lineTo");
  }
  if(lastSegment != goog.graphics.Path.Segment.LINETO) {
    this.segments_.push(goog.graphics.Path.Segment.LINETO);
    this.count_.push(0)
  }
  for(var i = 0;i < arguments.length;i += 2) {
    var x = arguments[i];
    var y = arguments[i + 1];
    this.arguments_.push(x, y)
  }
  this.count_[this.count_.length - 1] += i / 2;
  this.currentPoint_ = [x, y];
  return this
};
goog.graphics.Path.prototype.curveTo = function(var_args) {
  var lastSegment = goog.array.peek(this.segments_);
  if(lastSegment == null) {
    throw Error("Path cannot start with curve");
  }
  if(lastSegment != goog.graphics.Path.Segment.CURVETO) {
    this.segments_.push(goog.graphics.Path.Segment.CURVETO);
    this.count_.push(0)
  }
  for(var i = 0;i < arguments.length;i += 6) {
    var x = arguments[i + 4];
    var y = arguments[i + 5];
    this.arguments_.push(arguments[i], arguments[i + 1], arguments[i + 2], arguments[i + 3], x, y)
  }
  this.count_[this.count_.length - 1] += i / 6;
  this.currentPoint_ = [x, y];
  return this
};
goog.graphics.Path.prototype.close = function() {
  var lastSegment = goog.array.peek(this.segments_);
  if(lastSegment == null) {
    throw Error("Path cannot start with close");
  }
  if(lastSegment != goog.graphics.Path.Segment.CLOSE) {
    this.segments_.push(goog.graphics.Path.Segment.CLOSE);
    this.count_.push(1);
    this.currentPoint_ = this.closePoint_
  }
  return this
};
goog.graphics.Path.prototype.arc = function(cx, cy, rx, ry, fromAngle, extent, connect) {
  var startX = cx + goog.math.angleDx(fromAngle, rx);
  var startY = cy + goog.math.angleDy(fromAngle, ry);
  if(connect) {
    if(!this.currentPoint_ || startX != this.currentPoint_[0] || startY != this.currentPoint_[1]) {
      this.lineTo(startX, startY)
    }
  }else {
    this.moveTo(startX, startY)
  }
  return this.arcTo(rx, ry, fromAngle, extent)
};
goog.graphics.Path.prototype.arcTo = function(rx, ry, fromAngle, extent) {
  var cx = this.currentPoint_[0] - goog.math.angleDx(fromAngle, rx);
  var cy = this.currentPoint_[1] - goog.math.angleDy(fromAngle, ry);
  var ex = cx + goog.math.angleDx(fromAngle + extent, rx);
  var ey = cy + goog.math.angleDy(fromAngle + extent, ry);
  this.segments_.push(goog.graphics.Path.Segment.ARCTO);
  this.count_.push(1);
  this.arguments_.push(rx, ry, fromAngle, extent, ex, ey);
  this.simple_ = false;
  this.currentPoint_ = [ex, ey];
  return this
};
goog.graphics.Path.prototype.arcToAsCurves = function(rx, ry, fromAngle, extent) {
  var cx = this.currentPoint_[0] - goog.math.angleDx(fromAngle, rx);
  var cy = this.currentPoint_[1] - goog.math.angleDy(fromAngle, ry);
  var extentRad = goog.math.toRadians(extent);
  var arcSegs = Math.ceil(Math.abs(extentRad) / Math.PI * 2);
  var inc = extentRad / arcSegs;
  var angle = goog.math.toRadians(fromAngle);
  for(var j = 0;j < arcSegs;j++) {
    var relX = Math.cos(angle);
    var relY = Math.sin(angle);
    var z = 4 / 3 * Math.sin(inc / 2) / (1 + Math.cos(inc / 2));
    var c0 = cx + (relX - z * relY) * rx;
    var c1 = cy + (relY + z * relX) * ry;
    angle += inc;
    relX = Math.cos(angle);
    relY = Math.sin(angle);
    this.curveTo(c0, c1, cx + (relX + z * relY) * rx, cy + (relY - z * relX) * ry, cx + relX * rx, cy + relY * ry)
  }
  return this
};
goog.graphics.Path.prototype.forEachSegment = function(callback) {
  var points = this.arguments_;
  var index = 0;
  for(var i = 0, length = this.segments_.length;i < length;i++) {
    var seg = this.segments_[i];
    var n = goog.graphics.Path.segmentArgCounts_[seg] * this.count_[i];
    callback(seg, points.slice(index, index + n));
    index += n
  }
};
goog.graphics.Path.prototype.getCurrentPoint = function() {
  return this.currentPoint_ && this.currentPoint_.concat()
};
goog.graphics.Path.prototype.clone = function() {
  var path = new this.constructor;
  path.segments_ = this.segments_.concat();
  path.count_ = this.count_.concat();
  path.arguments_ = this.arguments_.concat();
  path.closePoint_ = this.closePoint_ && this.closePoint_.concat();
  path.currentPoint_ = this.currentPoint_ && this.currentPoint_.concat();
  path.simple_ = this.simple_;
  return path
};
goog.graphics.Path.prototype.isSimple = function() {
  return this.simple_
};
goog.graphics.Path.simplifySegmentMap_ = function() {
  var map = {};
  map[goog.graphics.Path.Segment.MOVETO] = goog.graphics.Path.prototype.moveTo;
  map[goog.graphics.Path.Segment.LINETO] = goog.graphics.Path.prototype.lineTo;
  map[goog.graphics.Path.Segment.CLOSE] = goog.graphics.Path.prototype.close;
  map[goog.graphics.Path.Segment.CURVETO] = goog.graphics.Path.prototype.curveTo;
  map[goog.graphics.Path.Segment.ARCTO] = goog.graphics.Path.prototype.arcToAsCurves;
  return map
}();
goog.graphics.Path.createSimplifiedPath = function(src) {
  if(src.isSimple()) {
    return src.clone()
  }
  var path = new goog.graphics.Path;
  src.forEachSegment(function(segment, args) {
    goog.graphics.Path.simplifySegmentMap_[segment].apply(path, args)
  });
  return path
};
goog.graphics.Path.prototype.createTransformedPath = function(tx) {
  var path = goog.graphics.Path.createSimplifiedPath(this);
  path.transform(tx);
  return path
};
goog.graphics.Path.prototype.transform = function(tx) {
  if(!this.isSimple()) {
    throw Error("Non-simple path");
  }
  tx.transform(this.arguments_, 0, this.arguments_, 0, this.arguments_.length / 2);
  if(this.closePoint_) {
    tx.transform(this.closePoint_, 0, this.closePoint_, 0, 1)
  }
  if(this.currentPoint_ && this.closePoint_ != this.currentPoint_) {
    tx.transform(this.currentPoint_, 0, this.currentPoint_, 0, 1)
  }
  return this
};
goog.graphics.Path.prototype.isEmpty = function() {
  return this.segments_.length == 0
};
goog.provide("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.math.Box = function(top, right, bottom, left) {
  this.top = top;
  this.right = right;
  this.bottom = bottom;
  this.left = left
};
goog.math.Box.boundingBox = function(var_args) {
  var box = new goog.math.Box(arguments[0].y, arguments[0].x, arguments[0].y, arguments[0].x);
  for(var i = 1;i < arguments.length;i++) {
    var coord = arguments[i];
    box.top = Math.min(box.top, coord.y);
    box.right = Math.max(box.right, coord.x);
    box.bottom = Math.max(box.bottom, coord.y);
    box.left = Math.min(box.left, coord.x)
  }
  return box
};
goog.math.Box.prototype.clone = function() {
  return new goog.math.Box(this.top, this.right, this.bottom, this.left)
};
if(goog.DEBUG) {
  goog.math.Box.prototype.toString = function() {
    return"(" + this.top + "t, " + this.right + "r, " + this.bottom + "b, " + this.left + "l)"
  }
}
goog.math.Box.prototype.contains = function(other) {
  return goog.math.Box.contains(this, other)
};
goog.math.Box.prototype.expand = function(top, opt_right, opt_bottom, opt_left) {
  if(goog.isObject(top)) {
    this.top -= top.top;
    this.right += top.right;
    this.bottom += top.bottom;
    this.left -= top.left
  }else {
    this.top -= top;
    this.right += opt_right;
    this.bottom += opt_bottom;
    this.left -= opt_left
  }
  return this
};
goog.math.Box.prototype.expandToInclude = function(box) {
  this.left = Math.min(this.left, box.left);
  this.top = Math.min(this.top, box.top);
  this.right = Math.max(this.right, box.right);
  this.bottom = Math.max(this.bottom, box.bottom)
};
goog.math.Box.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.top == b.top && a.right == b.right && a.bottom == b.bottom && a.left == b.left
};
goog.math.Box.contains = function(box, other) {
  if(!box || !other) {
    return false
  }
  if(other instanceof goog.math.Box) {
    return other.left >= box.left && other.right <= box.right && other.top >= box.top && other.bottom <= box.bottom
  }
  return other.x >= box.left && other.x <= box.right && other.y >= box.top && other.y <= box.bottom
};
goog.math.Box.distance = function(box, coord) {
  if(coord.x >= box.left && coord.x <= box.right) {
    if(coord.y >= box.top && coord.y <= box.bottom) {
      return 0
    }
    return coord.y < box.top ? box.top - coord.y : coord.y - box.bottom
  }
  if(coord.y >= box.top && coord.y <= box.bottom) {
    return coord.x < box.left ? box.left - coord.x : coord.x - box.right
  }
  return goog.math.Coordinate.distance(coord, new goog.math.Coordinate(coord.x < box.left ? box.left : box.right, coord.y < box.top ? box.top : box.bottom))
};
goog.math.Box.intersects = function(a, b) {
  return a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom
};
goog.math.Box.intersectsWithPadding = function(a, b, padding) {
  return a.left <= b.right + padding && b.left <= a.right + padding && a.top <= b.bottom + padding && b.top <= a.bottom + padding
};
goog.provide("goog.math.Rect");
goog.require("goog.math.Box");
goog.require("goog.math.Size");
goog.math.Rect = function(x, y, w, h) {
  this.left = x;
  this.top = y;
  this.width = w;
  this.height = h
};
goog.math.Rect.prototype.clone = function() {
  return new goog.math.Rect(this.left, this.top, this.width, this.height)
};
goog.math.Rect.prototype.toBox = function() {
  var right = this.left + this.width;
  var bottom = this.top + this.height;
  return new goog.math.Box(this.top, right, bottom, this.left)
};
goog.math.Rect.createFromBox = function(box) {
  return new goog.math.Rect(box.left, box.top, box.right - box.left, box.bottom - box.top)
};
if(goog.DEBUG) {
  goog.math.Rect.prototype.toString = function() {
    return"(" + this.left + ", " + this.top + " - " + this.width + "w x " + this.height + "h)"
  }
}
goog.math.Rect.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.left == b.left && a.width == b.width && a.top == b.top && a.height == b.height
};
goog.math.Rect.prototype.intersection = function(rect) {
  var x0 = Math.max(this.left, rect.left);
  var x1 = Math.min(this.left + this.width, rect.left + rect.width);
  if(x0 <= x1) {
    var y0 = Math.max(this.top, rect.top);
    var y1 = Math.min(this.top + this.height, rect.top + rect.height);
    if(y0 <= y1) {
      this.left = x0;
      this.top = y0;
      this.width = x1 - x0;
      this.height = y1 - y0;
      return true
    }
  }
  return false
};
goog.math.Rect.intersection = function(a, b) {
  var x0 = Math.max(a.left, b.left);
  var x1 = Math.min(a.left + a.width, b.left + b.width);
  if(x0 <= x1) {
    var y0 = Math.max(a.top, b.top);
    var y1 = Math.min(a.top + a.height, b.top + b.height);
    if(y0 <= y1) {
      return new goog.math.Rect(x0, y0, x1 - x0, y1 - y0)
    }
  }
  return null
};
goog.math.Rect.intersects = function(a, b) {
  return a.left <= b.left + b.width && b.left <= a.left + a.width && a.top <= b.top + b.height && b.top <= a.top + a.height
};
goog.math.Rect.prototype.intersects = function(rect) {
  return goog.math.Rect.intersects(this, rect)
};
goog.math.Rect.difference = function(a, b) {
  var intersection = goog.math.Rect.intersection(a, b);
  if(!intersection || !intersection.height || !intersection.width) {
    return[a.clone()]
  }
  var result = [];
  var top = a.top;
  var height = a.height;
  var ar = a.left + a.width;
  var ab = a.top + a.height;
  var br = b.left + b.width;
  var bb = b.top + b.height;
  if(b.top > a.top) {
    result.push(new goog.math.Rect(a.left, a.top, a.width, b.top - a.top));
    top = b.top;
    height -= b.top - a.top
  }
  if(bb < ab) {
    result.push(new goog.math.Rect(a.left, bb, a.width, ab - bb));
    height = bb - top
  }
  if(b.left > a.left) {
    result.push(new goog.math.Rect(a.left, top, b.left - a.left, height))
  }
  if(br < ar) {
    result.push(new goog.math.Rect(br, top, ar - br, height))
  }
  return result
};
goog.math.Rect.prototype.difference = function(rect) {
  return goog.math.Rect.difference(this, rect)
};
goog.math.Rect.prototype.boundingRect = function(rect) {
  var right = Math.max(this.left + this.width, rect.left + rect.width);
  var bottom = Math.max(this.top + this.height, rect.top + rect.height);
  this.left = Math.min(this.left, rect.left);
  this.top = Math.min(this.top, rect.top);
  this.width = right - this.left;
  this.height = bottom - this.top
};
goog.math.Rect.boundingRect = function(a, b) {
  if(!a || !b) {
    return null
  }
  var clone = a.clone();
  clone.boundingRect(b);
  return clone
};
goog.math.Rect.prototype.contains = function(another) {
  if(another instanceof goog.math.Rect) {
    return this.left <= another.left && this.left + this.width >= another.left + another.width && this.top <= another.top && this.top + this.height >= another.top + another.height
  }else {
    return another.x >= this.left && another.x <= this.left + this.width && another.y >= this.top && another.y <= this.top + this.height
  }
};
goog.math.Rect.prototype.getSize = function() {
  return new goog.math.Size(this.width, this.height)
};
goog.provide("goog.style");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Rect");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.style.setStyle = function(element, style, opt_value) {
  if(goog.isString(style)) {
    goog.style.setStyle_(element, opt_value, style)
  }else {
    goog.object.forEach(style, goog.partial(goog.style.setStyle_, element))
  }
};
goog.style.setStyle_ = function(element, value, style) {
  element.style[goog.string.toCamelCase(style)] = value
};
goog.style.getStyle = function(element, property) {
  return element.style[goog.string.toCamelCase(property)] || ""
};
goog.style.getComputedStyle = function(element, property) {
  var doc = goog.dom.getOwnerDocument(element);
  if(doc.defaultView && doc.defaultView.getComputedStyle) {
    var styles = doc.defaultView.getComputedStyle(element, null);
    if(styles) {
      return styles[property] || styles.getPropertyValue(property)
    }
  }
  return""
};
goog.style.getCascadedStyle = function(element, style) {
  return element.currentStyle ? element.currentStyle[style] : null
};
goog.style.getStyle_ = function(element, style) {
  return goog.style.getComputedStyle(element, style) || goog.style.getCascadedStyle(element, style) || element.style[style]
};
goog.style.getComputedPosition = function(element) {
  return goog.style.getStyle_(element, "position")
};
goog.style.getBackgroundColor = function(element) {
  return goog.style.getStyle_(element, "backgroundColor")
};
goog.style.getComputedOverflowX = function(element) {
  return goog.style.getStyle_(element, "overflowX")
};
goog.style.getComputedOverflowY = function(element) {
  return goog.style.getStyle_(element, "overflowY")
};
goog.style.getComputedZIndex = function(element) {
  return goog.style.getStyle_(element, "zIndex")
};
goog.style.getComputedTextAlign = function(element) {
  return goog.style.getStyle_(element, "textAlign")
};
goog.style.getComputedCursor = function(element) {
  return goog.style.getStyle_(element, "cursor")
};
goog.style.setPosition = function(el, arg1, opt_arg2) {
  var x, y;
  var buggyGeckoSubPixelPos = goog.userAgent.GECKO && (goog.userAgent.MAC || goog.userAgent.X11) && goog.userAgent.isVersion("1.9");
  if(arg1 instanceof goog.math.Coordinate) {
    x = arg1.x;
    y = arg1.y
  }else {
    x = arg1;
    y = opt_arg2
  }
  el.style.left = goog.style.getPixelStyleValue_(x, buggyGeckoSubPixelPos);
  el.style.top = goog.style.getPixelStyleValue_(y, buggyGeckoSubPixelPos)
};
goog.style.getPosition = function(element) {
  return new goog.math.Coordinate(element.offsetLeft, element.offsetTop)
};
goog.style.getClientViewportElement = function(opt_node) {
  var doc;
  if(opt_node) {
    if(opt_node.nodeType == goog.dom.NodeType.DOCUMENT) {
      doc = opt_node
    }else {
      doc = goog.dom.getOwnerDocument(opt_node)
    }
  }else {
    doc = goog.dom.getDocument()
  }
  if(goog.userAgent.IE && !goog.userAgent.isDocumentMode(9) && !goog.dom.getDomHelper(doc).isCss1CompatMode()) {
    return doc.body
  }
  return doc.documentElement
};
goog.style.getBoundingClientRect_ = function(el) {
  var rect = el.getBoundingClientRect();
  if(goog.userAgent.IE) {
    var doc = el.ownerDocument;
    rect.left -= doc.documentElement.clientLeft + doc.body.clientLeft;
    rect.top -= doc.documentElement.clientTop + doc.body.clientTop
  }
  return rect
};
goog.style.getOffsetParent = function(element) {
  if(goog.userAgent.IE) {
    return element.offsetParent
  }
  var doc = goog.dom.getOwnerDocument(element);
  var positionStyle = goog.style.getStyle_(element, "position");
  var skipStatic = positionStyle == "fixed" || positionStyle == "absolute";
  for(var parent = element.parentNode;parent && parent != doc;parent = parent.parentNode) {
    positionStyle = goog.style.getStyle_(parent, "position");
    skipStatic = skipStatic && positionStyle == "static" && parent != doc.documentElement && parent != doc.body;
    if(!skipStatic && (parent.scrollWidth > parent.clientWidth || parent.scrollHeight > parent.clientHeight || positionStyle == "fixed" || positionStyle == "absolute" || positionStyle == "relative")) {
      return parent
    }
  }
  return null
};
goog.style.getVisibleRectForElement = function(element) {
  var visibleRect = new goog.math.Box(0, Infinity, Infinity, 0);
  var dom = goog.dom.getDomHelper(element);
  var body = dom.getDocument().body;
  var documentElement = dom.getDocument().documentElement;
  var scrollEl = dom.getDocumentScrollElement();
  for(var el = element;el = goog.style.getOffsetParent(el);) {
    if((!goog.userAgent.IE || el.clientWidth != 0) && (!goog.userAgent.WEBKIT || el.clientHeight != 0 || el != body) && el != body && el != documentElement && goog.style.getStyle_(el, "overflow") != "visible") {
      var pos = goog.style.getPageOffset(el);
      var client = goog.style.getClientLeftTop(el);
      pos.x += client.x;
      pos.y += client.y;
      visibleRect.top = Math.max(visibleRect.top, pos.y);
      visibleRect.right = Math.min(visibleRect.right, pos.x + el.clientWidth);
      visibleRect.bottom = Math.min(visibleRect.bottom, pos.y + el.clientHeight);
      visibleRect.left = Math.max(visibleRect.left, pos.x)
    }
  }
  var scrollX = scrollEl.scrollLeft, scrollY = scrollEl.scrollTop;
  visibleRect.left = Math.max(visibleRect.left, scrollX);
  visibleRect.top = Math.max(visibleRect.top, scrollY);
  var winSize = dom.getViewportSize();
  visibleRect.right = Math.min(visibleRect.right, scrollX + winSize.width);
  visibleRect.bottom = Math.min(visibleRect.bottom, scrollY + winSize.height);
  return visibleRect.top >= 0 && visibleRect.left >= 0 && visibleRect.bottom > visibleRect.top && visibleRect.right > visibleRect.left ? visibleRect : null
};
goog.style.scrollIntoContainerView = function(element, container, opt_center) {
  var elementPos = goog.style.getPageOffset(element);
  var containerPos = goog.style.getPageOffset(container);
  var containerBorder = goog.style.getBorderBox(container);
  var relX = elementPos.x - containerPos.x - containerBorder.left;
  var relY = elementPos.y - containerPos.y - containerBorder.top;
  var spaceX = container.clientWidth - element.offsetWidth;
  var spaceY = container.clientHeight - element.offsetHeight;
  if(opt_center) {
    container.scrollLeft += relX - spaceX / 2;
    container.scrollTop += relY - spaceY / 2
  }else {
    container.scrollLeft += Math.min(relX, Math.max(relX - spaceX, 0));
    container.scrollTop += Math.min(relY, Math.max(relY - spaceY, 0))
  }
};
goog.style.getClientLeftTop = function(el) {
  if(goog.userAgent.GECKO && !goog.userAgent.isVersion("1.9")) {
    var left = parseFloat(goog.style.getComputedStyle(el, "borderLeftWidth"));
    if(goog.style.isRightToLeft(el)) {
      var scrollbarWidth = el.offsetWidth - el.clientWidth - left - parseFloat(goog.style.getComputedStyle(el, "borderRightWidth"));
      left += scrollbarWidth
    }
    return new goog.math.Coordinate(left, parseFloat(goog.style.getComputedStyle(el, "borderTopWidth")))
  }
  return new goog.math.Coordinate(el.clientLeft, el.clientTop)
};
goog.style.getPageOffset = function(el) {
  var box, doc = goog.dom.getOwnerDocument(el);
  var positionStyle = goog.style.getStyle_(el, "position");
  var BUGGY_GECKO_BOX_OBJECT = goog.userAgent.GECKO && doc.getBoxObjectFor && !el.getBoundingClientRect && positionStyle == "absolute" && (box = doc.getBoxObjectFor(el)) && (box.screenX < 0 || box.screenY < 0);
  var pos = new goog.math.Coordinate(0, 0);
  var viewportElement = goog.style.getClientViewportElement(doc);
  if(el == viewportElement) {
    return pos
  }
  if(el.getBoundingClientRect) {
    box = goog.style.getBoundingClientRect_(el);
    var scrollCoord = goog.dom.getDomHelper(doc).getDocumentScroll();
    pos.x = box.left + scrollCoord.x;
    pos.y = box.top + scrollCoord.y
  }else {
    if(doc.getBoxObjectFor && !BUGGY_GECKO_BOX_OBJECT) {
      box = doc.getBoxObjectFor(el);
      var vpBox = doc.getBoxObjectFor(viewportElement);
      pos.x = box.screenX - vpBox.screenX;
      pos.y = box.screenY - vpBox.screenY
    }else {
      var parent = el;
      do {
        pos.x += parent.offsetLeft;
        pos.y += parent.offsetTop;
        if(parent != el) {
          pos.x += parent.clientLeft || 0;
          pos.y += parent.clientTop || 0
        }
        if(goog.userAgent.WEBKIT && goog.style.getComputedPosition(parent) == "fixed") {
          pos.x += doc.body.scrollLeft;
          pos.y += doc.body.scrollTop;
          break
        }
        parent = parent.offsetParent
      }while(parent && parent != el);
      if(goog.userAgent.OPERA || goog.userAgent.WEBKIT && positionStyle == "absolute") {
        pos.y -= doc.body.offsetTop
      }
      for(parent = el;(parent = goog.style.getOffsetParent(parent)) && parent != doc.body && parent != viewportElement;) {
        pos.x -= parent.scrollLeft;
        if(!goog.userAgent.OPERA || parent.tagName != "TR") {
          pos.y -= parent.scrollTop
        }
      }
    }
  }
  return pos
};
goog.style.getPageOffsetLeft = function(el) {
  return goog.style.getPageOffset(el).x
};
goog.style.getPageOffsetTop = function(el) {
  return goog.style.getPageOffset(el).y
};
goog.style.getFramedPageOffset = function(el, relativeWin) {
  var position = new goog.math.Coordinate(0, 0);
  var currentWin = goog.dom.getWindow(goog.dom.getOwnerDocument(el));
  var currentEl = el;
  do {
    var offset = currentWin == relativeWin ? goog.style.getPageOffset(currentEl) : goog.style.getClientPosition(currentEl);
    position.x += offset.x;
    position.y += offset.y
  }while(currentWin && currentWin != relativeWin && (currentEl = currentWin.frameElement) && (currentWin = currentWin.parent));
  return position
};
goog.style.translateRectForAnotherFrame = function(rect, origBase, newBase) {
  if(origBase.getDocument() != newBase.getDocument()) {
    var body = origBase.getDocument().body;
    var pos = goog.style.getFramedPageOffset(body, newBase.getWindow());
    pos = goog.math.Coordinate.difference(pos, goog.style.getPageOffset(body));
    if(goog.userAgent.IE && !origBase.isCss1CompatMode()) {
      pos = goog.math.Coordinate.difference(pos, origBase.getDocumentScroll())
    }
    rect.left += pos.x;
    rect.top += pos.y
  }
};
goog.style.getRelativePosition = function(a, b) {
  var ap = goog.style.getClientPosition(a);
  var bp = goog.style.getClientPosition(b);
  return new goog.math.Coordinate(ap.x - bp.x, ap.y - bp.y)
};
goog.style.getClientPosition = function(el) {
  var pos = new goog.math.Coordinate;
  if(el.nodeType == goog.dom.NodeType.ELEMENT) {
    if(el.getBoundingClientRect) {
      var box = goog.style.getBoundingClientRect_(el);
      pos.x = box.left;
      pos.y = box.top
    }else {
      var scrollCoord = goog.dom.getDomHelper(el).getDocumentScroll();
      var pageCoord = goog.style.getPageOffset(el);
      pos.x = pageCoord.x - scrollCoord.x;
      pos.y = pageCoord.y - scrollCoord.y
    }
  }else {
    var isAbstractedEvent = goog.isFunction(el.getBrowserEvent);
    var targetEvent = el;
    if(el.targetTouches) {
      targetEvent = el.targetTouches[0]
    }else {
      if(isAbstractedEvent && el.getBrowserEvent().targetTouches) {
        targetEvent = el.getBrowserEvent().targetTouches[0]
      }
    }
    pos.x = targetEvent.clientX;
    pos.y = targetEvent.clientY
  }
  return pos
};
goog.style.setPageOffset = function(el, x, opt_y) {
  var cur = goog.style.getPageOffset(el);
  if(x instanceof goog.math.Coordinate) {
    opt_y = x.y;
    x = x.x
  }
  var dx = x - cur.x;
  var dy = opt_y - cur.y;
  goog.style.setPosition(el, el.offsetLeft + dx, el.offsetTop + dy)
};
goog.style.setSize = function(element, w, opt_h) {
  var h;
  if(w instanceof goog.math.Size) {
    h = w.height;
    w = w.width
  }else {
    if(opt_h == undefined) {
      throw Error("missing height argument");
    }
    h = opt_h
  }
  goog.style.setWidth(element, w);
  goog.style.setHeight(element, h)
};
goog.style.getPixelStyleValue_ = function(value, round) {
  if(typeof value == "number") {
    value = (round ? Math.round(value) : value) + "px"
  }
  return value
};
goog.style.setHeight = function(element, height) {
  element.style.height = goog.style.getPixelStyleValue_(height, true)
};
goog.style.setWidth = function(element, width) {
  element.style.width = goog.style.getPixelStyleValue_(width, true)
};
goog.style.getSize = function(element) {
  if(goog.style.getStyle_(element, "display") != "none") {
    return goog.style.getSizeWithDisplay_(element)
  }
  var style = element.style;
  var originalDisplay = style.display;
  var originalVisibility = style.visibility;
  var originalPosition = style.position;
  style.visibility = "hidden";
  style.position = "absolute";
  style.display = "inline";
  var size = goog.style.getSizeWithDisplay_(element);
  style.display = originalDisplay;
  style.position = originalPosition;
  style.visibility = originalVisibility;
  return size
};
goog.style.getSizeWithDisplay_ = function(element) {
  var offsetWidth = element.offsetWidth;
  var offsetHeight = element.offsetHeight;
  var webkitOffsetsZero = goog.userAgent.WEBKIT && !offsetWidth && !offsetHeight;
  if((!goog.isDef(offsetWidth) || webkitOffsetsZero) && element.getBoundingClientRect) {
    var clientRect = goog.style.getBoundingClientRect_(element);
    return new goog.math.Size(clientRect.right - clientRect.left, clientRect.bottom - clientRect.top)
  }
  return new goog.math.Size(offsetWidth, offsetHeight)
};
goog.style.getBounds = function(element) {
  var o = goog.style.getPageOffset(element);
  var s = goog.style.getSize(element);
  return new goog.math.Rect(o.x, o.y, s.width, s.height)
};
goog.style.toCamelCase = function(selector) {
  return goog.string.toCamelCase(String(selector))
};
goog.style.toSelectorCase = function(selector) {
  return goog.string.toSelectorCase(selector)
};
goog.style.getOpacity = function(el) {
  var style = el.style;
  var result = "";
  if("opacity" in style) {
    result = style.opacity
  }else {
    if("MozOpacity" in style) {
      result = style.MozOpacity
    }else {
      if("filter" in style) {
        var match = style.filter.match(/alpha\(opacity=([\d.]+)\)/);
        if(match) {
          result = String(match[1] / 100)
        }
      }
    }
  }
  return result == "" ? result : Number(result)
};
goog.style.setOpacity = function(el, alpha) {
  var style = el.style;
  if("opacity" in style) {
    style.opacity = alpha
  }else {
    if("MozOpacity" in style) {
      style.MozOpacity = alpha
    }else {
      if("filter" in style) {
        if(alpha === "") {
          style.filter = ""
        }else {
          style.filter = "alpha(opacity=" + alpha * 100 + ")"
        }
      }
    }
  }
};
goog.style.setTransparentBackgroundImage = function(el, src) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(" + 'src="' + src + '", sizingMethod="crop")'
  }else {
    style.backgroundImage = "url(" + src + ")";
    style.backgroundPosition = "top left";
    style.backgroundRepeat = "no-repeat"
  }
};
goog.style.clearTransparentBackgroundImage = function(el) {
  var style = el.style;
  if("filter" in style) {
    style.filter = ""
  }else {
    style.backgroundImage = "none"
  }
};
goog.style.showElement = function(el, display) {
  el.style.display = display ? "" : "none"
};
goog.style.isElementShown = function(el) {
  return el.style.display != "none"
};
goog.style.installStyles = function(stylesString, opt_node) {
  var dh = goog.dom.getDomHelper(opt_node);
  var styleSheet = null;
  if(goog.userAgent.IE) {
    styleSheet = dh.getDocument().createStyleSheet();
    goog.style.setStyles(styleSheet, stylesString)
  }else {
    var head = dh.getElementsByTagNameAndClass("head")[0];
    if(!head) {
      var body = dh.getElementsByTagNameAndClass("body")[0];
      head = dh.createDom("head");
      body.parentNode.insertBefore(head, body)
    }
    styleSheet = dh.createDom("style");
    goog.style.setStyles(styleSheet, stylesString);
    dh.appendChild(head, styleSheet)
  }
  return styleSheet
};
goog.style.uninstallStyles = function(styleSheet) {
  var node = styleSheet.ownerNode || styleSheet.owningElement || styleSheet;
  goog.dom.removeNode(node)
};
goog.style.setStyles = function(element, stylesString) {
  if(goog.userAgent.IE) {
    element.cssText = stylesString
  }else {
    var propToSet = goog.userAgent.WEBKIT ? "innerText" : "innerHTML";
    element[propToSet] = stylesString
  }
};
goog.style.setPreWrap = function(el) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.whiteSpace = "pre";
    style.wordWrap = "break-word"
  }else {
    if(goog.userAgent.GECKO) {
      style.whiteSpace = "-moz-pre-wrap"
    }else {
      style.whiteSpace = "pre-wrap"
    }
  }
};
goog.style.setInlineBlock = function(el) {
  var style = el.style;
  style.position = "relative";
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.zoom = "1";
    style.display = "inline"
  }else {
    if(goog.userAgent.GECKO) {
      style.display = goog.userAgent.isVersion("1.9a") ? "inline-block" : "-moz-inline-box"
    }else {
      style.display = "inline-block"
    }
  }
};
goog.style.isRightToLeft = function(el) {
  return"rtl" == goog.style.getStyle_(el, "direction")
};
goog.style.unselectableStyle_ = goog.userAgent.GECKO ? "MozUserSelect" : goog.userAgent.WEBKIT ? "WebkitUserSelect" : null;
goog.style.isUnselectable = function(el) {
  if(goog.style.unselectableStyle_) {
    return el.style[goog.style.unselectableStyle_].toLowerCase() == "none"
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      return el.getAttribute("unselectable") == "on"
    }
  }
  return false
};
goog.style.setUnselectable = function(el, unselectable, opt_noRecurse) {
  var descendants = !opt_noRecurse ? el.getElementsByTagName("*") : null;
  var name = goog.style.unselectableStyle_;
  if(name) {
    var value = unselectable ? "none" : "";
    el.style[name] = value;
    if(descendants) {
      for(var i = 0, descendant;descendant = descendants[i];i++) {
        descendant.style[name] = value
      }
    }
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      var value = unselectable ? "on" : "";
      el.setAttribute("unselectable", value);
      if(descendants) {
        for(var i = 0, descendant;descendant = descendants[i];i++) {
          descendant.setAttribute("unselectable", value)
        }
      }
    }
  }
};
goog.style.getBorderBoxSize = function(element) {
  return new goog.math.Size(element.offsetWidth, element.offsetHeight)
};
goog.style.setBorderBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right;
      style.pixelHeight = size.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom
    }else {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "border-box")
  }
};
goog.style.getContentBoxSize = function(element) {
  var doc = goog.dom.getOwnerDocument(element);
  var ieCurrentStyle = goog.userAgent.IE && element.currentStyle;
  if(ieCurrentStyle && goog.dom.getDomHelper(doc).isCss1CompatMode() && ieCurrentStyle.width != "auto" && ieCurrentStyle.height != "auto" && !ieCurrentStyle.boxSizing) {
    var width = goog.style.getIePixelValue_(element, ieCurrentStyle.width, "width", "pixelWidth");
    var height = goog.style.getIePixelValue_(element, ieCurrentStyle.height, "height", "pixelHeight");
    return new goog.math.Size(width, height)
  }else {
    var borderBoxSize = goog.style.getBorderBoxSize(element);
    var paddingBox = goog.style.getPaddingBox(element);
    var borderBox = goog.style.getBorderBox(element);
    return new goog.math.Size(borderBoxSize.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right, borderBoxSize.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom)
  }
};
goog.style.setContentBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }else {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width + borderBox.left + paddingBox.left + paddingBox.right + borderBox.right;
      style.pixelHeight = size.height + borderBox.top + paddingBox.top + paddingBox.bottom + borderBox.bottom
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "content-box")
  }
};
goog.style.setBoxSizingSize_ = function(element, size, boxSizing) {
  var style = element.style;
  if(goog.userAgent.GECKO) {
    style.MozBoxSizing = boxSizing
  }else {
    if(goog.userAgent.WEBKIT) {
      style.WebkitBoxSizing = boxSizing
    }else {
      style.boxSizing = boxSizing
    }
  }
  style.width = size.width + "px";
  style.height = size.height + "px"
};
goog.style.getIePixelValue_ = function(element, value, name, pixelName) {
  if(/^\d+px?$/.test(value)) {
    return parseInt(value, 10)
  }else {
    var oldStyleValue = element.style[name];
    var oldRuntimeValue = element.runtimeStyle[name];
    element.runtimeStyle[name] = element.currentStyle[name];
    element.style[name] = value;
    var pixelValue = element.style[pixelName];
    element.style[name] = oldStyleValue;
    element.runtimeStyle[name] = oldRuntimeValue;
    return pixelValue
  }
};
goog.style.getIePixelDistance_ = function(element, propName) {
  return goog.style.getIePixelValue_(element, goog.style.getCascadedStyle(element, propName), "left", "pixelLeft")
};
goog.style.getBox_ = function(element, stylePrefix) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelDistance_(element, stylePrefix + "Left");
    var right = goog.style.getIePixelDistance_(element, stylePrefix + "Right");
    var top = goog.style.getIePixelDistance_(element, stylePrefix + "Top");
    var bottom = goog.style.getIePixelDistance_(element, stylePrefix + "Bottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, stylePrefix + "Left");
    var right = goog.style.getComputedStyle(element, stylePrefix + "Right");
    var top = goog.style.getComputedStyle(element, stylePrefix + "Top");
    var bottom = goog.style.getComputedStyle(element, stylePrefix + "Bottom");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getPaddingBox = function(element) {
  return goog.style.getBox_(element, "padding")
};
goog.style.getMarginBox = function(element) {
  return goog.style.getBox_(element, "margin")
};
goog.style.ieBorderWidthKeywords_ = {"thin":2, "medium":4, "thick":6};
goog.style.getIePixelBorder_ = function(element, prop) {
  if(goog.style.getCascadedStyle(element, prop + "Style") == "none") {
    return 0
  }
  var width = goog.style.getCascadedStyle(element, prop + "Width");
  if(width in goog.style.ieBorderWidthKeywords_) {
    return goog.style.ieBorderWidthKeywords_[width]
  }
  return goog.style.getIePixelValue_(element, width, "left", "pixelLeft")
};
goog.style.getBorderBox = function(element) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelBorder_(element, "borderLeft");
    var right = goog.style.getIePixelBorder_(element, "borderRight");
    var top = goog.style.getIePixelBorder_(element, "borderTop");
    var bottom = goog.style.getIePixelBorder_(element, "borderBottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, "borderLeftWidth");
    var right = goog.style.getComputedStyle(element, "borderRightWidth");
    var top = goog.style.getComputedStyle(element, "borderTopWidth");
    var bottom = goog.style.getComputedStyle(element, "borderBottomWidth");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getFontFamily = function(el) {
  var doc = goog.dom.getOwnerDocument(el);
  var font = "";
  if(doc.body.createTextRange) {
    var range = doc.body.createTextRange();
    range.moveToElementText(el);
    try {
      font = range.queryCommandValue("FontName")
    }catch(e) {
      font = ""
    }
  }
  if(!font) {
    font = goog.style.getStyle_(el, "fontFamily")
  }
  var fontsArray = font.split(",");
  if(fontsArray.length > 1) {
    font = fontsArray[0]
  }
  return goog.string.stripQuotes(font, "\"'")
};
goog.style.lengthUnitRegex_ = /[^\d]+$/;
goog.style.getLengthUnits = function(value) {
  var units = value.match(goog.style.lengthUnitRegex_);
  return units && units[0] || null
};
goog.style.ABSOLUTE_CSS_LENGTH_UNITS_ = {"cm":1, "in":1, "mm":1, "pc":1, "pt":1};
goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_ = {"em":1, "ex":1};
goog.style.getFontSize = function(el) {
  var fontSize = goog.style.getStyle_(el, "fontSize");
  var sizeUnits = goog.style.getLengthUnits(fontSize);
  if(fontSize && "px" == sizeUnits) {
    return parseInt(fontSize, 10)
  }
  if(goog.userAgent.IE) {
    if(sizeUnits in goog.style.ABSOLUTE_CSS_LENGTH_UNITS_) {
      return goog.style.getIePixelValue_(el, fontSize, "left", "pixelLeft")
    }else {
      if(el.parentNode && el.parentNode.nodeType == goog.dom.NodeType.ELEMENT && sizeUnits in goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_) {
        var parentElement = el.parentNode;
        var parentSize = goog.style.getStyle_(parentElement, "fontSize");
        return goog.style.getIePixelValue_(parentElement, fontSize == parentSize ? "1em" : fontSize, "left", "pixelLeft")
      }
    }
  }
  var sizeElement = goog.dom.createDom("span", {"style":"visibility:hidden;position:absolute;" + "line-height:0;padding:0;margin:0;border:0;height:1em;"});
  goog.dom.appendChild(el, sizeElement);
  fontSize = sizeElement.offsetHeight;
  goog.dom.removeNode(sizeElement);
  return fontSize
};
goog.style.parseStyleAttribute = function(value) {
  var result = {};
  goog.array.forEach(value.split(/\s*;\s*/), function(pair) {
    var keyValue = pair.split(/\s*:\s*/);
    if(keyValue.length == 2) {
      result[goog.string.toCamelCase(keyValue[0].toLowerCase())] = keyValue[1]
    }
  });
  return result
};
goog.style.toStyleAttribute = function(obj) {
  var buffer = [];
  goog.object.forEach(obj, function(value, key) {
    buffer.push(goog.string.toSelectorCase(key), ":", value, ";")
  });
  return buffer.join("")
};
goog.style.setFloat = function(el, value) {
  el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] = value
};
goog.style.getFloat = function(el) {
  return el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] || ""
};
goog.style.getScrollbarWidth = function(opt_className) {
  var outerDiv = goog.dom.createElement("div");
  if(opt_className) {
    outerDiv.className = opt_className
  }
  outerDiv.style.cssText = "visiblity:hidden;overflow:auto;" + "position:absolute;top:0;width:100px;height:100px";
  var innerDiv = goog.dom.createElement("div");
  goog.style.setSize(innerDiv, "200px", "200px");
  outerDiv.appendChild(innerDiv);
  goog.dom.appendChild(goog.dom.getDocument().body, outerDiv);
  var width = outerDiv.offsetWidth - outerDiv.clientWidth;
  goog.dom.removeNode(outerDiv);
  return width
};
goog.provide("goog.disposable.IDisposable");
goog.disposable.IDisposable = function() {
};
goog.disposable.IDisposable.prototype.dispose;
goog.disposable.IDisposable.prototype.isDisposed;
goog.provide("goog.Disposable");
goog.provide("goog.dispose");
goog.require("goog.disposable.IDisposable");
goog.Disposable = function() {
  if(goog.Disposable.ENABLE_MONITORING) {
    goog.Disposable.instances_[goog.getUid(this)] = this
  }
};
goog.Disposable.ENABLE_MONITORING = false;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for(var id in goog.Disposable.instances_) {
    if(goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)])
    }
  }
  return ret
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {}
};
goog.Disposable.prototype.disposed_ = false;
goog.Disposable.prototype.dependentDisposables_;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if(!this.disposed_) {
    this.disposed_ = true;
    this.disposeInternal();
    if(goog.Disposable.ENABLE_MONITORING) {
      var uid = goog.getUid(this);
      if(!goog.Disposable.instances_.hasOwnProperty(uid)) {
        throw Error(this + " did not call the goog.Disposable base " + "constructor or was disposed of after a clearUndisposedObjects " + "call");
      }
      delete goog.Disposable.instances_[uid]
    }
  }
};
goog.Disposable.prototype.registerDisposable = function(disposable) {
  if(!this.dependentDisposables_) {
    this.dependentDisposables_ = []
  }
  this.dependentDisposables_.push(disposable)
};
goog.Disposable.prototype.disposeInternal = function() {
  if(this.dependentDisposables_) {
    goog.disposeAll.apply(null, this.dependentDisposables_)
  }
};
goog.dispose = function(obj) {
  if(obj && typeof obj.dispose == "function") {
    obj.dispose()
  }
};
goog.disposeAll = function(var_args) {
  for(var i = 0, len = arguments.length;i < len;++i) {
    var disposable = arguments[i];
    if(goog.isArrayLike(disposable)) {
      goog.disposeAll.apply(null, disposable)
    }else {
      goog.dispose(disposable)
    }
  }
};
goog.provide("goog.debug.EntryPointMonitor");
goog.provide("goog.debug.entryPointRegistry");
goog.require("goog.asserts");
goog.debug.EntryPointMonitor = function() {
};
goog.debug.EntryPointMonitor.prototype.wrap;
goog.debug.EntryPointMonitor.prototype.unwrap;
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.monitors_ = [];
goog.debug.entryPointRegistry.monitorsMayExist_ = false;
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback;
  if(goog.debug.entryPointRegistry.monitorsMayExist_) {
    var monitors = goog.debug.entryPointRegistry.monitors_;
    for(var i = 0;i < monitors.length;i++) {
      callback(goog.bind(monitors[i].wrap, monitors[i]))
    }
  }
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  goog.debug.entryPointRegistry.monitorsMayExist_ = true;
  var transformer = goog.bind(monitor.wrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
  goog.debug.entryPointRegistry.monitors_.push(monitor)
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var monitors = goog.debug.entryPointRegistry.monitors_;
  goog.asserts.assert(monitor == monitors[monitors.length - 1], "Only the most recent monitor can be unwrapped.");
  var transformer = goog.bind(monitor.unwrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
  monitors.length--
};
goog.provide("goog.debug.errorHandlerWeakDep");
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(fn, opt_tracers) {
  return fn
}};
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), HAS_W3C_EVENT_SUPPORT:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("8")};
goog.provide("goog.events.Event");
goog.require("goog.Disposable");
goog.events.Event = function(type, opt_target) {
  goog.Disposable.call(this);
  this.type = type;
  this.target = opt_target;
  this.currentTarget = this.target
};
goog.inherits(goog.events.Event, goog.Disposable);
goog.events.Event.prototype.disposeInternal = function() {
  delete this.type;
  delete this.target;
  delete this.currentTarget
};
goog.events.Event.prototype.propagationStopped_ = false;
goog.events.Event.prototype.returnValue_ = true;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true
};
goog.events.Event.prototype.preventDefault = function() {
  this.returnValue_ = false
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation()
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault()
};
goog.provide("goog.reflect");
goog.reflect.object = function(type, object) {
  return object
};
goog.reflect.sinkValue = function(x) {
  goog.reflect.sinkValue[" "](x);
  return x
};
goog.reflect.sinkValue[" "] = goog.nullFunction;
goog.reflect.canAccessProperty = function(obj, prop) {
  try {
    goog.reflect.sinkValue(obj[prop]);
    return true
  }catch(e) {
  }
  return false
};
goog.provide("goog.events.BrowserEvent");
goog.provide("goog.events.BrowserEvent.MouseButton");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.reflect");
goog.require("goog.userAgent");
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  if(opt_e) {
    this.init(opt_e, opt_currentTarget)
  }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.target = null;
goog.events.BrowserEvent.prototype.currentTarget;
goog.events.BrowserEvent.prototype.relatedTarget = null;
goog.events.BrowserEvent.prototype.offsetX = 0;
goog.events.BrowserEvent.prototype.offsetY = 0;
goog.events.BrowserEvent.prototype.clientX = 0;
goog.events.BrowserEvent.prototype.clientY = 0;
goog.events.BrowserEvent.prototype.screenX = 0;
goog.events.BrowserEvent.prototype.screenY = 0;
goog.events.BrowserEvent.prototype.button = 0;
goog.events.BrowserEvent.prototype.keyCode = 0;
goog.events.BrowserEvent.prototype.charCode = 0;
goog.events.BrowserEvent.prototype.ctrlKey = false;
goog.events.BrowserEvent.prototype.altKey = false;
goog.events.BrowserEvent.prototype.shiftKey = false;
goog.events.BrowserEvent.prototype.metaKey = false;
goog.events.BrowserEvent.prototype.state;
goog.events.BrowserEvent.prototype.platformModifierKey = false;
goog.events.BrowserEvent.prototype.event_ = null;
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  goog.events.Event.call(this, type);
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;
  var relatedTarget = e.relatedTarget;
  if(relatedTarget) {
    if(goog.userAgent.GECKO) {
      if(!goog.reflect.canAccessProperty(relatedTarget, "nodeName")) {
        relatedTarget = null
      }
    }
  }else {
    if(type == goog.events.EventType.MOUSEOVER) {
      relatedTarget = e.fromElement
    }else {
      if(type == goog.events.EventType.MOUSEOUT) {
        relatedTarget = e.toElement
      }
    }
  }
  this.relatedTarget = relatedTarget;
  this.offsetX = e.offsetX !== undefined ? e.offsetX : e.layerX;
  this.offsetY = e.offsetY !== undefined ? e.offsetY : e.layerY;
  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;
  this.button = e.button;
  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == "keypress" ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  delete this.returnValue_;
  delete this.propagationStopped_
};
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if(!goog.events.BrowserFeature.HAS_W3C_BUTTON) {
    if(this.type == "click") {
      return button == goog.events.BrowserEvent.MouseButton.LEFT
    }else {
      return!!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[button])
    }
  }else {
    return this.event_.button == button
  }
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey)
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  if(this.event_.stopPropagation) {
    this.event_.stopPropagation()
  }else {
    this.event_.cancelBubble = true
  }
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if(!be.preventDefault) {
    be.returnValue = false;
    if(goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        var VK_F1 = 112;
        var VK_F12 = 123;
        if(be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1
        }
      }catch(ex) {
      }
    }
  }else {
    be.preventDefault()
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
  goog.events.BrowserEvent.superClass_.disposeInternal.call(this);
  this.event_ = null;
  this.target = null;
  this.currentTarget = null;
  this.relatedTarget = null
};
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.provide("goog.events.Listener");
goog.events.Listener = function() {
};
goog.events.Listener.counter_ = 0;
goog.events.Listener.prototype.isFunctionListener_;
goog.events.Listener.prototype.listener;
goog.events.Listener.prototype.proxy;
goog.events.Listener.prototype.src;
goog.events.Listener.prototype.type;
goog.events.Listener.prototype.capture;
goog.events.Listener.prototype.handler;
goog.events.Listener.prototype.key = 0;
goog.events.Listener.prototype.removed = false;
goog.events.Listener.prototype.callOnce = false;
goog.events.Listener.prototype.init = function(listener, proxy, src, type, capture, opt_handler) {
  if(goog.isFunction(listener)) {
    this.isFunctionListener_ = true
  }else {
    if(listener && listener.handleEvent && goog.isFunction(listener.handleEvent)) {
      this.isFunctionListener_ = false
    }else {
      throw Error("Invalid listener argument");
    }
  }
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = ++goog.events.Listener.counter_;
  this.removed = false
};
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if(this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject)
  }
  return this.listener.handleEvent.call(this.listener, eventObject)
};
goog.provide("goog.events");
goog.require("goog.array");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventWrapper");
goog.require("goog.events.Listener");
goog.require("goog.object");
goog.require("goog.userAgent");
goog.events.ASSUME_GOOD_GC = false;
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if(!type) {
    throw Error("Invalid event type");
  }else {
    if(goog.isArray(type)) {
      for(var i = 0;i < type.length;i++) {
        goog.events.listen(src, type[i], listener, opt_capt, opt_handler)
      }
      return null
    }else {
      var capture = !!opt_capt;
      var map = goog.events.listenerTree_;
      if(!(type in map)) {
        map[type] = {count_:0, remaining_:0}
      }
      map = map[type];
      if(!(capture in map)) {
        map[capture] = {count_:0, remaining_:0};
        map.count_++
      }
      map = map[capture];
      var srcUid = goog.getUid(src);
      var listenerArray, listenerObj;
      map.remaining_++;
      if(!map[srcUid]) {
        listenerArray = map[srcUid] = [];
        map.count_++
      }else {
        listenerArray = map[srcUid];
        for(var i = 0;i < listenerArray.length;i++) {
          listenerObj = listenerArray[i];
          if(listenerObj.listener == listener && listenerObj.handler == opt_handler) {
            if(listenerObj.removed) {
              break
            }
            return listenerArray[i].key
          }
        }
      }
      var proxy = goog.events.getProxy();
      proxy.src = src;
      listenerObj = new goog.events.Listener;
      listenerObj.init(listener, proxy, src, type, capture, opt_handler);
      var key = listenerObj.key;
      proxy.key = key;
      listenerArray.push(listenerObj);
      goog.events.listeners_[key] = listenerObj;
      if(!goog.events.sources_[srcUid]) {
        goog.events.sources_[srcUid] = []
      }
      goog.events.sources_[srcUid].push(listenerObj);
      if(src.addEventListener) {
        if(src == goog.global || !src.customEvent_) {
          src.addEventListener(type, proxy, capture)
        }
      }else {
        src.attachEvent(goog.events.getOnString_(type), proxy)
      }
      return key
    }
  }
};
goog.events.getProxy = function() {
  var proxyCallbackFunction = goog.events.handleBrowserEvent_;
  var f = goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT ? function(eventObject) {
    return proxyCallbackFunction.call(f.src, f.key, eventObject)
  } : function(eventObject) {
    var v = proxyCallbackFunction.call(f.src, f.key, eventObject);
    if(!v) {
      return v
    }
  };
  return f
};
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  var listenerObj = goog.events.listeners_[key];
  listenerObj.callOnce = true;
  return key
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler)
};
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(!listenerArray) {
    return false
  }
  for(var i = 0;i < listenerArray.length;i++) {
    if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key)
    }
  }
  return false
};
goog.events.unlistenByKey = function(key) {
  if(!goog.events.listeners_[key]) {
    return false
  }
  var listener = goog.events.listeners_[key];
  if(listener.removed) {
    return false
  }
  var src = listener.src;
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;
  if(src.removeEventListener) {
    if(src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture)
    }
  }else {
    if(src.detachEvent) {
      src.detachEvent(goog.events.getOnString_(type), proxy)
    }
  }
  var srcUid = goog.getUid(src);
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];
  if(goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    if(sourcesArray.length == 0) {
      delete goog.events.sources_[srcUid]
    }
  }
  listener.removed = true;
  listenerArray.needsCleanup_ = true;
  goog.events.cleanUp_(type, capture, srcUid, listenerArray);
  delete goog.events.listeners_[key];
  return true
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler)
};
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  if(!listenerArray.locked_) {
    if(listenerArray.needsCleanup_) {
      for(var oldIndex = 0, newIndex = 0;oldIndex < listenerArray.length;oldIndex++) {
        if(listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          continue
        }
        if(oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex]
        }
        newIndex++
      }
      listenerArray.length = newIndex;
      listenerArray.needsCleanup_ = false;
      if(newIndex == 0) {
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;
        if(goog.events.listenerTree_[type][capture].count_ == 0) {
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--
        }
        if(goog.events.listenerTree_[type].count_ == 0) {
          delete goog.events.listenerTree_[type]
        }
      }
    }
  }
};
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0;
  var noObj = opt_obj == null;
  var noType = opt_type == null;
  var noCapt = opt_capt == null;
  opt_capt = !!opt_capt;
  if(!noObj) {
    var srcUid = goog.getUid(opt_obj);
    if(goog.events.sources_[srcUid]) {
      var sourcesArray = goog.events.sources_[srcUid];
      for(var i = sourcesArray.length - 1;i >= 0;i--) {
        var listener = sourcesArray[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    }
  }else {
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for(var i = listeners.length - 1;i >= 0;i--) {
        var listener = listeners[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    })
  }
  return count
};
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || []
};
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      map = map[capture];
      var objUid = goog.getUid(obj);
      if(map[objUid]) {
        return map[objUid]
      }
    }
  }
  return null
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(listenerArray) {
    for(var i = 0;i < listenerArray.length;i++) {
      if(!listenerArray[i].removed && listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
        return listenerArray[i]
      }
    }
  }
  return null
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objUid = goog.getUid(obj);
  var listeners = goog.events.sources_[objUid];
  if(listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);
    if(hasType && hasCapture) {
      var map = goog.events.listenerTree_[opt_type];
      return!!map && !!map[opt_capture] && objUid in map[opt_capture]
    }else {
      if(!(hasType || hasCapture)) {
        return true
      }else {
        return goog.array.some(listeners, function(listener) {
          return hasType && listener.type == opt_type || hasCapture && listener.capture == opt_capture
        })
      }
    }
  }
  return false
};
goog.events.expose = function(e) {
  var str = [];
  for(var key in e) {
    if(e[key] && e[key].id) {
      str.push(key + " = " + e[key] + " (" + e[key].id + ")")
    }else {
      str.push(key + " = " + e[key])
    }
  }
  return str.join("\n")
};
goog.events.getOnString_ = function(type) {
  if(type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type]
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type, capture, eventObject)
    }
  }
  return true
};
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;
  var objUid = goog.getUid(obj);
  if(map[objUid]) {
    map.remaining_--;
    var listenerArray = map[objUid];
    if(!listenerArray.locked_) {
      listenerArray.locked_ = 1
    }else {
      listenerArray.locked_++
    }
    try {
      var length = listenerArray.length;
      for(var i = 0;i < length;i++) {
        var listener = listenerArray[i];
        if(listener && !listener.removed) {
          retval &= goog.events.fireListener(listener, eventObject) !== false
        }
      }
    }finally {
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objUid, listenerArray)
    }
  }
  return Boolean(retval)
};
goog.events.fireListener = function(listener, eventObject) {
  var rv = listener.handleEvent(eventObject);
  if(listener.callOnce) {
    goog.events.unlistenByKey(listener.key)
  }
  return rv
};
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_)
};
goog.events.dispatchEvent = function(src, e) {
  var type = e.type || e;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  if(goog.isString(e)) {
    e = new goog.events.Event(e, src)
  }else {
    if(!(e instanceof goog.events.Event)) {
      var oldEvent = e;
      e = new goog.events.Event(type, src);
      goog.object.extend(e, oldEvent)
    }else {
      e.target = e.target || src
    }
  }
  var rv = 1, ancestors;
  map = map[type];
  var hasCapture = true in map;
  var targetsMap;
  if(hasCapture) {
    ancestors = [];
    for(var parent = src;parent;parent = parent.getParentEventTarget()) {
      ancestors.push(parent)
    }
    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;
    for(var i = ancestors.length - 1;!e.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, true, e) && e.returnValue_ != false
    }
  }
  var hasBubble = false in map;
  if(hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;
    if(hasCapture) {
      for(var i = 0;!e.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, false, e) && e.returnValue_ != false
      }
    }else {
      for(var current = src;!e.propagationStopped_ && current && targetsMap.remaining_;current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type, false, e) && e.returnValue_ != false
      }
    }
  }
  return Boolean(rv)
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  if(!goog.events.listeners_[key]) {
    return true
  }
  var listener = goog.events.listeners_[key];
  var type = listener.type;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  map = map[type];
  var retval, targetsMap;
  if(!goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event");
    var hasCapture = true in map;
    var hasBubble = false in map;
    if(hasCapture) {
      if(goog.events.isMarkedIeEvent_(ieEvent)) {
        return true
      }
      goog.events.markIeEvent_(ieEvent)
    }
    var evt = new goog.events.BrowserEvent;
    evt.init(ieEvent, this);
    retval = true;
    try {
      if(hasCapture) {
        var ancestors = [];
        for(var parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent)
        }
        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;
        for(var i = ancestors.length - 1;!evt.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, true, evt)
        }
        if(hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;
          for(var i = 0;!evt.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, false, evt)
          }
        }
      }else {
        retval = goog.events.fireListener(listener, evt)
      }
    }finally {
      if(ancestors) {
        ancestors.length = 0
      }
      evt.dispose()
    }
    return retval
  }
  var be = new goog.events.BrowserEvent(opt_evt, this);
  try {
    retval = goog.events.fireListener(listener, be)
  }finally {
    be.dispose()
  }
  return retval
};
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = false;
  if(e.keyCode == 0) {
    try {
      e.keyCode = -1;
      return
    }catch(ex) {
      useReturnValue = true
    }
  }
  if(useReturnValue || e.returnValue == undefined) {
    e.returnValue = true
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_)
});
goog.provide("goog.events.EventHandler");
goog.require("goog.Disposable");
goog.require("goog.array");
goog.require("goog.events");
goog.require("goog.events.EventWrapper");
goog.events.EventHandler = function(opt_handler) {
  goog.Disposable.call(this);
  this.handler_ = opt_handler;
  this.keys_ = []
};
goog.inherits(goog.events.EventHandler, goog.Disposable);
goog.events.EventHandler.typeArray_ = [];
goog.events.EventHandler.prototype.listen = function(src, type, opt_fn, opt_capture, opt_handler) {
  if(!goog.isArray(type)) {
    goog.events.EventHandler.typeArray_[0] = type;
    type = goog.events.EventHandler.typeArray_
  }
  for(var i = 0;i < type.length;i++) {
    var key = goog.events.listen(src, type[i], opt_fn || this, opt_capture || false, opt_handler || this.handler_ || this);
    this.keys_.push(key)
  }
  return this
};
goog.events.EventHandler.prototype.listenOnce = function(src, type, opt_fn, opt_capture, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      this.listenOnce(src, type[i], opt_fn, opt_capture, opt_handler)
    }
  }else {
    var key = goog.events.listenOnce(src, type, opt_fn || this, opt_capture, opt_handler || this.handler_ || this);
    this.keys_.push(key)
  }
  return this
};
goog.events.EventHandler.prototype.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler || this.handler_, this);
  return this
};
goog.events.EventHandler.prototype.getListenerCount = function() {
  return this.keys_.length
};
goog.events.EventHandler.prototype.unlisten = function(src, type, opt_fn, opt_capture, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      this.unlisten(src, type[i], opt_fn, opt_capture, opt_handler)
    }
  }else {
    var listener = goog.events.getListener(src, type, opt_fn || this, opt_capture, opt_handler || this.handler_ || this);
    if(listener) {
      var key = listener.key;
      goog.events.unlistenByKey(key);
      goog.array.remove(this.keys_, key)
    }
  }
  return this
};
goog.events.EventHandler.prototype.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler || this.handler_, this);
  return this
};
goog.events.EventHandler.prototype.removeAll = function() {
  goog.array.forEach(this.keys_, goog.events.unlistenByKey);
  this.keys_.length = 0
};
goog.events.EventHandler.prototype.disposeInternal = function() {
  goog.events.EventHandler.superClass_.disposeInternal.call(this);
  this.removeAll()
};
goog.events.EventHandler.prototype.handleEvent = function(e) {
  throw Error("EventHandler.handleEvent not implemented");
};
goog.provide("goog.events.EventTarget");
goog.require("goog.Disposable");
goog.require("goog.events");
goog.events.EventTarget = function() {
  goog.Disposable.call(this)
};
goog.inherits(goog.events.EventTarget, goog.Disposable);
goog.events.EventTarget.prototype.customEvent_ = true;
goog.events.EventTarget.prototype.parentEventTarget_ = null;
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_
};
goog.events.EventTarget.prototype.setParentEventTarget = function(parent) {
  this.parentEventTarget_ = parent
};
goog.events.EventTarget.prototype.addEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.listen(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.removeEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.unlisten(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.dispatchEvent = function(e) {
  return goog.events.dispatchEvent(this, e)
};
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  goog.events.removeAll(this);
  this.parentEventTarget_ = null
};
goog.provide("goog.ui.IdGenerator");
goog.ui.IdGenerator = function() {
};
goog.addSingletonGetter(goog.ui.IdGenerator);
goog.ui.IdGenerator.prototype.nextId_ = 0;
goog.ui.IdGenerator.prototype.getNextUniqueId = function() {
  return":" + (this.nextId_++).toString(36)
};
goog.ui.IdGenerator.instance = goog.ui.IdGenerator.getInstance();
goog.provide("goog.ui.Component");
goog.provide("goog.ui.Component.Error");
goog.provide("goog.ui.Component.EventType");
goog.provide("goog.ui.Component.State");
goog.require("goog.array");
goog.require("goog.array.ArrayLike");
goog.require("goog.dom");
goog.require("goog.events.EventHandler");
goog.require("goog.events.EventTarget");
goog.require("goog.object");
goog.require("goog.style");
goog.require("goog.ui.IdGenerator");
goog.ui.Component = function(opt_domHelper) {
  goog.events.EventTarget.call(this);
  this.dom_ = opt_domHelper || goog.dom.getDomHelper();
  this.rightToLeft_ = goog.ui.Component.defaultRightToLeft_
};
goog.inherits(goog.ui.Component, goog.events.EventTarget);
goog.ui.Component.prototype.idGenerator_ = goog.ui.IdGenerator.getInstance();
goog.ui.Component.defaultRightToLeft_ = null;
goog.ui.Component.EventType = {BEFORE_SHOW:"beforeshow", SHOW:"show", HIDE:"hide", DISABLE:"disable", ENABLE:"enable", HIGHLIGHT:"highlight", UNHIGHLIGHT:"unhighlight", ACTIVATE:"activate", DEACTIVATE:"deactivate", SELECT:"select", UNSELECT:"unselect", CHECK:"check", UNCHECK:"uncheck", FOCUS:"focus", BLUR:"blur", OPEN:"open", CLOSE:"close", ENTER:"enter", LEAVE:"leave", ACTION:"action", CHANGE:"change"};
goog.ui.Component.Error = {NOT_SUPPORTED:"Method not supported", DECORATE_INVALID:"Invalid element to decorate", ALREADY_RENDERED:"Component already rendered", PARENT_UNABLE_TO_BE_SET:"Unable to set parent component", CHILD_INDEX_OUT_OF_BOUNDS:"Child component index out of bounds", NOT_OUR_CHILD:"Child is not in parent component", NOT_IN_DOCUMENT:"Operation not supported while component is not in document", STATE_INVALID:"Invalid component state"};
goog.ui.Component.State = {ALL:255, DISABLED:1, HOVER:2, ACTIVE:4, SELECTED:8, CHECKED:16, FOCUSED:32, OPENED:64};
goog.ui.Component.getStateTransitionEvent = function(state, isEntering) {
  switch(state) {
    case goog.ui.Component.State.DISABLED:
      return isEntering ? goog.ui.Component.EventType.DISABLE : goog.ui.Component.EventType.ENABLE;
    case goog.ui.Component.State.HOVER:
      return isEntering ? goog.ui.Component.EventType.HIGHLIGHT : goog.ui.Component.EventType.UNHIGHLIGHT;
    case goog.ui.Component.State.ACTIVE:
      return isEntering ? goog.ui.Component.EventType.ACTIVATE : goog.ui.Component.EventType.DEACTIVATE;
    case goog.ui.Component.State.SELECTED:
      return isEntering ? goog.ui.Component.EventType.SELECT : goog.ui.Component.EventType.UNSELECT;
    case goog.ui.Component.State.CHECKED:
      return isEntering ? goog.ui.Component.EventType.CHECK : goog.ui.Component.EventType.UNCHECK;
    case goog.ui.Component.State.FOCUSED:
      return isEntering ? goog.ui.Component.EventType.FOCUS : goog.ui.Component.EventType.BLUR;
    case goog.ui.Component.State.OPENED:
      return isEntering ? goog.ui.Component.EventType.OPEN : goog.ui.Component.EventType.CLOSE;
    default:
  }
  throw Error(goog.ui.Component.Error.STATE_INVALID);
};
goog.ui.Component.setDefaultRightToLeft = function(rightToLeft) {
  goog.ui.Component.defaultRightToLeft_ = rightToLeft
};
goog.ui.Component.prototype.id_ = null;
goog.ui.Component.prototype.dom_;
goog.ui.Component.prototype.inDocument_ = false;
goog.ui.Component.prototype.element_ = null;
goog.ui.Component.prototype.googUiComponentHandler_;
goog.ui.Component.prototype.rightToLeft_ = null;
goog.ui.Component.prototype.model_ = null;
goog.ui.Component.prototype.parent_ = null;
goog.ui.Component.prototype.children_ = null;
goog.ui.Component.prototype.childIndex_ = null;
goog.ui.Component.prototype.wasDecorated_ = false;
goog.ui.Component.prototype.getId = function() {
  return this.id_ || (this.id_ = this.idGenerator_.getNextUniqueId())
};
goog.ui.Component.prototype.setId = function(id) {
  if(this.parent_ && this.parent_.childIndex_) {
    goog.object.remove(this.parent_.childIndex_, this.id_);
    goog.object.add(this.parent_.childIndex_, id, this)
  }
  this.id_ = id
};
goog.ui.Component.prototype.getElement = function() {
  return this.element_
};
goog.ui.Component.prototype.setElementInternal = function(element) {
  this.element_ = element
};
goog.ui.Component.prototype.getElementsByClass = function(className) {
  return this.element_ ? this.dom_.getElementsByClass(className, this.element_) : []
};
goog.ui.Component.prototype.getElementByClass = function(className) {
  return this.element_ ? this.dom_.getElementByClass(className, this.element_) : null
};
goog.ui.Component.prototype.getHandler = function() {
  return this.googUiComponentHandler_ || (this.googUiComponentHandler_ = new goog.events.EventHandler(this))
};
goog.ui.Component.prototype.setParent = function(parent) {
  if(this == parent) {
    throw Error(goog.ui.Component.Error.PARENT_UNABLE_TO_BE_SET);
  }
  if(parent && this.parent_ && this.id_ && this.parent_.getChild(this.id_) && this.parent_ != parent) {
    throw Error(goog.ui.Component.Error.PARENT_UNABLE_TO_BE_SET);
  }
  this.parent_ = parent;
  goog.ui.Component.superClass_.setParentEventTarget.call(this, parent)
};
goog.ui.Component.prototype.getParent = function() {
  return this.parent_
};
goog.ui.Component.prototype.setParentEventTarget = function(parent) {
  if(this.parent_ && this.parent_ != parent) {
    throw Error(goog.ui.Component.Error.NOT_SUPPORTED);
  }
  goog.ui.Component.superClass_.setParentEventTarget.call(this, parent)
};
goog.ui.Component.prototype.getDomHelper = function() {
  return this.dom_
};
goog.ui.Component.prototype.isInDocument = function() {
  return this.inDocument_
};
goog.ui.Component.prototype.createDom = function() {
  this.element_ = this.dom_.createElement("div")
};
goog.ui.Component.prototype.render = function(opt_parentElement) {
  this.render_(opt_parentElement)
};
goog.ui.Component.prototype.renderBefore = function(sibling) {
  this.render_(sibling.parentNode, sibling)
};
goog.ui.Component.prototype.render_ = function(opt_parentElement, opt_beforeNode) {
  if(this.inDocument_) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }
  if(!this.element_) {
    this.createDom()
  }
  if(opt_parentElement) {
    opt_parentElement.insertBefore(this.element_, opt_beforeNode || null)
  }else {
    this.dom_.getDocument().body.appendChild(this.element_)
  }
  if(!this.parent_ || this.parent_.isInDocument()) {
    this.enterDocument()
  }
};
goog.ui.Component.prototype.decorate = function(element) {
  if(this.inDocument_) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }else {
    if(element && this.canDecorate(element)) {
      this.wasDecorated_ = true;
      if(!this.dom_ || this.dom_.getDocument() != goog.dom.getOwnerDocument(element)) {
        this.dom_ = goog.dom.getDomHelper(element)
      }
      this.decorateInternal(element);
      this.enterDocument()
    }else {
      throw Error(goog.ui.Component.Error.DECORATE_INVALID);
    }
  }
};
goog.ui.Component.prototype.canDecorate = function(element) {
  return true
};
goog.ui.Component.prototype.wasDecorated = function() {
  return this.wasDecorated_
};
goog.ui.Component.prototype.decorateInternal = function(element) {
  this.element_ = element
};
goog.ui.Component.prototype.enterDocument = function() {
  this.inDocument_ = true;
  this.forEachChild(function(child) {
    if(!child.isInDocument() && child.getElement()) {
      child.enterDocument()
    }
  })
};
goog.ui.Component.prototype.exitDocument = function() {
  this.forEachChild(function(child) {
    if(child.isInDocument()) {
      child.exitDocument()
    }
  });
  if(this.googUiComponentHandler_) {
    this.googUiComponentHandler_.removeAll()
  }
  this.inDocument_ = false
};
goog.ui.Component.prototype.disposeInternal = function() {
  goog.ui.Component.superClass_.disposeInternal.call(this);
  if(this.inDocument_) {
    this.exitDocument()
  }
  if(this.googUiComponentHandler_) {
    this.googUiComponentHandler_.dispose();
    delete this.googUiComponentHandler_
  }
  this.forEachChild(function(child) {
    child.dispose()
  });
  if(!this.wasDecorated_ && this.element_) {
    goog.dom.removeNode(this.element_)
  }
  this.children_ = null;
  this.childIndex_ = null;
  this.element_ = null;
  this.model_ = null;
  this.parent_ = null
};
goog.ui.Component.prototype.makeId = function(idFragment) {
  return this.getId() + "." + idFragment
};
goog.ui.Component.prototype.makeIds = function(object) {
  var ids = {};
  for(var key in object) {
    ids[key] = this.makeId(object[key])
  }
  return ids
};
goog.ui.Component.prototype.getModel = function() {
  return this.model_
};
goog.ui.Component.prototype.setModel = function(obj) {
  this.model_ = obj
};
goog.ui.Component.prototype.getFragmentFromId = function(id) {
  return id.substring(this.getId().length + 1)
};
goog.ui.Component.prototype.getElementByFragment = function(idFragment) {
  if(!this.inDocument_) {
    throw Error(goog.ui.Component.Error.NOT_IN_DOCUMENT);
  }
  return this.dom_.getElement(this.makeId(idFragment))
};
goog.ui.Component.prototype.addChild = function(child, opt_render) {
  this.addChildAt(child, this.getChildCount(), opt_render)
};
goog.ui.Component.prototype.addChildAt = function(child, index, opt_render) {
  if(child.inDocument_ && (opt_render || !this.inDocument_)) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }
  if(index < 0 || index > this.getChildCount()) {
    throw Error(goog.ui.Component.Error.CHILD_INDEX_OUT_OF_BOUNDS);
  }
  if(!this.childIndex_ || !this.children_) {
    this.childIndex_ = {};
    this.children_ = []
  }
  if(child.getParent() == this) {
    goog.object.set(this.childIndex_, child.getId(), child);
    goog.array.remove(this.children_, child)
  }else {
    goog.object.add(this.childIndex_, child.getId(), child)
  }
  child.setParent(this);
  goog.array.insertAt(this.children_, child, index);
  if(child.inDocument_ && this.inDocument_ && child.getParent() == this) {
    var contentElement = this.getContentElement();
    contentElement.insertBefore(child.getElement(), contentElement.childNodes[index] || null)
  }else {
    if(opt_render) {
      if(!this.element_) {
        this.createDom()
      }
      var sibling = this.getChildAt(index + 1);
      child.render_(this.getContentElement(), sibling ? sibling.element_ : null)
    }else {
      if(this.inDocument_ && !child.inDocument_ && child.element_) {
        child.enterDocument()
      }
    }
  }
};
goog.ui.Component.prototype.getContentElement = function() {
  return this.element_
};
goog.ui.Component.prototype.isRightToLeft = function() {
  if(this.rightToLeft_ == null) {
    this.rightToLeft_ = goog.style.isRightToLeft(this.inDocument_ ? this.element_ : this.dom_.getDocument().body)
  }
  return this.rightToLeft_
};
goog.ui.Component.prototype.setRightToLeft = function(rightToLeft) {
  if(this.inDocument_) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }
  this.rightToLeft_ = rightToLeft
};
goog.ui.Component.prototype.hasChildren = function() {
  return!!this.children_ && this.children_.length != 0
};
goog.ui.Component.prototype.getChildCount = function() {
  return this.children_ ? this.children_.length : 0
};
goog.ui.Component.prototype.getChildIds = function() {
  var ids = [];
  this.forEachChild(function(child) {
    ids.push(child.getId())
  });
  return ids
};
goog.ui.Component.prototype.getChild = function(id) {
  return this.childIndex_ && id ? goog.object.get(this.childIndex_, id) || null : null
};
goog.ui.Component.prototype.getChildAt = function(index) {
  return this.children_ ? this.children_[index] || null : null
};
goog.ui.Component.prototype.forEachChild = function(f, opt_obj) {
  if(this.children_) {
    goog.array.forEach(this.children_, f, opt_obj)
  }
};
goog.ui.Component.prototype.indexOfChild = function(child) {
  return this.children_ && child ? goog.array.indexOf(this.children_, child) : -1
};
goog.ui.Component.prototype.removeChild = function(child, opt_unrender) {
  if(child) {
    var id = goog.isString(child) ? child : child.getId();
    child = this.getChild(id);
    if(id && child) {
      goog.object.remove(this.childIndex_, id);
      goog.array.remove(this.children_, child);
      if(opt_unrender) {
        child.exitDocument();
        if(child.element_) {
          goog.dom.removeNode(child.element_)
        }
      }
      child.setParent(null)
    }
  }
  if(!child) {
    throw Error(goog.ui.Component.Error.NOT_OUR_CHILD);
  }
  return child
};
goog.ui.Component.prototype.removeChildAt = function(index, opt_unrender) {
  return this.removeChild(this.getChildAt(index), opt_unrender)
};
goog.ui.Component.prototype.removeChildren = function(opt_unrender) {
  while(this.hasChildren()) {
    this.removeChildAt(0, opt_unrender)
  }
};
goog.provide("goog.graphics.AbstractGraphics");
goog.require("goog.graphics.Path");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.require("goog.style");
goog.require("goog.ui.Component");
goog.graphics.AbstractGraphics = function(width, height, opt_coordWidth, opt_coordHeight, opt_domHelper) {
  goog.ui.Component.call(this, opt_domHelper);
  this.width = width;
  this.height = height;
  this.coordWidth = opt_coordWidth || null;
  this.coordHeight = opt_coordHeight || null
};
goog.inherits(goog.graphics.AbstractGraphics, goog.ui.Component);
goog.graphics.AbstractGraphics.prototype.canvasElement = null;
goog.graphics.AbstractGraphics.prototype.coordLeft = 0;
goog.graphics.AbstractGraphics.prototype.coordTop = 0;
goog.graphics.AbstractGraphics.prototype.getCanvasElement = function() {
  return this.canvasElement
};
goog.graphics.AbstractGraphics.prototype.setCoordSize = function(coordWidth, coordHeight) {
  this.coordWidth = coordWidth;
  this.coordHeight = coordHeight
};
goog.graphics.AbstractGraphics.prototype.getCoordSize = function() {
  if(this.coordWidth) {
    return new goog.math.Size(this.coordWidth, this.coordHeight)
  }else {
    return this.getPixelSize()
  }
};
goog.graphics.AbstractGraphics.prototype.setCoordOrigin = goog.abstractMethod;
goog.graphics.AbstractGraphics.prototype.getCoordOrigin = function() {
  return new goog.math.Coordinate(this.coordLeft, this.coordTop)
};
goog.graphics.AbstractGraphics.prototype.setSize = goog.abstractMethod;
goog.graphics.AbstractGraphics.prototype.getSize = function() {
  return this.getPixelSize()
};
goog.graphics.AbstractGraphics.prototype.getPixelSize = function() {
  if(this.isInDocument()) {
    return goog.style.getSize(this.getElement())
  }
  if(goog.isNumber(this.width) && goog.isNumber(this.height)) {
    return new goog.math.Size(this.width, this.height)
  }
  return null
};
goog.graphics.AbstractGraphics.prototype.getPixelScaleX = function() {
  var pixelSize = this.getPixelSize();
  return pixelSize ? pixelSize.width / this.getCoordSize().width : 0
};
goog.graphics.AbstractGraphics.prototype.getPixelScaleY = function() {
  var pixelSize = this.getPixelSize();
  return pixelSize ? pixelSize.height / this.getCoordSize().height : 0
};
goog.graphics.AbstractGraphics.prototype.clear = goog.abstractMethod;
goog.graphics.AbstractGraphics.prototype.removeElement = function(element) {
  goog.dom.removeNode(element.getElement())
};
goog.graphics.AbstractGraphics.prototype.setElementFill = goog.abstractMethod;
goog.graphics.AbstractGraphics.prototype.setElementStroke = goog.abstractMethod;
goog.graphics.AbstractGraphics.prototype.setElementTransform = goog.abstractMethod;
goog.graphics.AbstractGraphics.prototype.drawCircle = function(cx, cy, r, stroke, fill, opt_group) {
  return this.drawEllipse(cx, cy, r, r, stroke, fill, opt_group)
};
goog.graphics.AbstractGraphics.prototype.drawEllipse = goog.abstractMethod;
goog.graphics.AbstractGraphics.prototype.drawRect = goog.abstractMethod;
goog.graphics.AbstractGraphics.prototype.drawText = function(text, x, y, width, height, align, vAlign, font, stroke, fill, opt_group) {
  var baseline = font.size / 2;
  var textY;
  if(vAlign == "bottom") {
    textY = y + height - baseline
  }else {
    if(vAlign == "center") {
      textY = y + height / 2
    }else {
      textY = y + baseline
    }
  }
  return this.drawTextOnLine(text, x, textY, x + width, textY, align, font, stroke, fill, opt_group)
};
goog.graphics.AbstractGraphics.prototype.drawTextOnLine = goog.abstractMethod;
goog.graphics.AbstractGraphics.prototype.drawPath = goog.abstractMethod;
goog.graphics.AbstractGraphics.prototype.createGroup = goog.abstractMethod;
goog.graphics.AbstractGraphics.prototype.createPath = function() {
  return new goog.graphics.Path
};
goog.graphics.AbstractGraphics.prototype.getTextWidth = goog.abstractMethod;
goog.graphics.AbstractGraphics.prototype.isDomClonable = function() {
  return false
};
goog.graphics.AbstractGraphics.prototype.suspend = function() {
};
goog.graphics.AbstractGraphics.prototype.resume = function() {
};
goog.provide("goog.graphics.AffineTransform");
goog.require("goog.math");
goog.graphics.AffineTransform = function(opt_m00, opt_m10, opt_m01, opt_m11, opt_m02, opt_m12) {
  if(arguments.length == 6) {
    this.setTransform(opt_m00, opt_m10, opt_m01, opt_m11, opt_m02, opt_m12)
  }else {
    if(arguments.length != 0) {
      throw Error("Insufficient matrix parameters");
    }else {
      this.m00_ = this.m11_ = 1;
      this.m10_ = this.m01_ = this.m02_ = this.m12_ = 0
    }
  }
};
goog.graphics.AffineTransform.prototype.isIdentity = function() {
  return this.m00_ == 1 && this.m10_ == 0 && this.m01_ == 0 && this.m11_ == 1 && this.m02_ == 0 && this.m12_ == 0
};
goog.graphics.AffineTransform.prototype.clone = function() {
  return new goog.graphics.AffineTransform(this.m00_, this.m10_, this.m01_, this.m11_, this.m02_, this.m12_)
};
goog.graphics.AffineTransform.prototype.setTransform = function(m00, m10, m01, m11, m02, m12) {
  if(!goog.isNumber(m00) || !goog.isNumber(m10) || !goog.isNumber(m01) || !goog.isNumber(m11) || !goog.isNumber(m02) || !goog.isNumber(m12)) {
    throw Error("Invalid transform parameters");
  }
  this.m00_ = m00;
  this.m10_ = m10;
  this.m01_ = m01;
  this.m11_ = m11;
  this.m02_ = m02;
  this.m12_ = m12;
  return this
};
goog.graphics.AffineTransform.prototype.copyFrom = function(tx) {
  this.m00_ = tx.m00_;
  this.m10_ = tx.m10_;
  this.m01_ = tx.m01_;
  this.m11_ = tx.m11_;
  this.m02_ = tx.m02_;
  this.m12_ = tx.m12_;
  return this
};
goog.graphics.AffineTransform.prototype.scale = function(sx, sy) {
  this.m00_ *= sx;
  this.m10_ *= sx;
  this.m01_ *= sy;
  this.m11_ *= sy;
  return this
};
goog.graphics.AffineTransform.prototype.preScale = function(sx, sy) {
  this.m00_ *= sx;
  this.m01_ *= sx;
  this.m02_ *= sx;
  this.m10_ *= sy;
  this.m11_ *= sy;
  this.m12_ *= sy;
  return this
};
goog.graphics.AffineTransform.prototype.translate = function(dx, dy) {
  this.m02_ += dx * this.m00_ + dy * this.m01_;
  this.m12_ += dx * this.m10_ + dy * this.m11_;
  return this
};
goog.graphics.AffineTransform.prototype.preTranslate = function(dx, dy) {
  this.m02_ += dx;
  this.m12_ += dy;
  return this
};
goog.graphics.AffineTransform.prototype.rotate = function(theta, x, y) {
  return this.concatenate(goog.graphics.AffineTransform.getRotateInstance(theta, x, y))
};
goog.graphics.AffineTransform.prototype.preRotate = function(theta, x, y) {
  return this.preConcatenate(goog.graphics.AffineTransform.getRotateInstance(theta, x, y))
};
goog.graphics.AffineTransform.prototype.shear = function(shx, shy) {
  var m00 = this.m00_;
  var m10 = this.m10_;
  this.m00_ += shy * this.m01_;
  this.m10_ += shy * this.m11_;
  this.m01_ += shx * m00;
  this.m11_ += shx * m10;
  return this
};
goog.graphics.AffineTransform.prototype.preShear = function(shx, shy) {
  var m00 = this.m00_;
  var m01 = this.m01_;
  var m02 = this.m02_;
  this.m00_ += shx * this.m10_;
  this.m01_ += shx * this.m11_;
  this.m02_ += shx * this.m12_;
  this.m10_ += shy * m00;
  this.m11_ += shy * m01;
  this.m12_ += shy * m02;
  return this
};
goog.graphics.AffineTransform.prototype.toString = function() {
  return"matrix(" + [this.m00_, this.m10_, this.m01_, this.m11_, this.m02_, this.m12_].join(",") + ")"
};
goog.graphics.AffineTransform.prototype.getScaleX = function() {
  return this.m00_
};
goog.graphics.AffineTransform.prototype.getScaleY = function() {
  return this.m11_
};
goog.graphics.AffineTransform.prototype.getTranslateX = function() {
  return this.m02_
};
goog.graphics.AffineTransform.prototype.getTranslateY = function() {
  return this.m12_
};
goog.graphics.AffineTransform.prototype.getShearX = function() {
  return this.m01_
};
goog.graphics.AffineTransform.prototype.getShearY = function() {
  return this.m10_
};
goog.graphics.AffineTransform.prototype.concatenate = function(tx) {
  var m0 = this.m00_;
  var m1 = this.m01_;
  this.m00_ = tx.m00_ * m0 + tx.m10_ * m1;
  this.m01_ = tx.m01_ * m0 + tx.m11_ * m1;
  this.m02_ += tx.m02_ * m0 + tx.m12_ * m1;
  m0 = this.m10_;
  m1 = this.m11_;
  this.m10_ = tx.m00_ * m0 + tx.m10_ * m1;
  this.m11_ = tx.m01_ * m0 + tx.m11_ * m1;
  this.m12_ += tx.m02_ * m0 + tx.m12_ * m1;
  return this
};
goog.graphics.AffineTransform.prototype.preConcatenate = function(tx) {
  var m0 = this.m00_;
  var m1 = this.m10_;
  this.m00_ = tx.m00_ * m0 + tx.m01_ * m1;
  this.m10_ = tx.m10_ * m0 + tx.m11_ * m1;
  m0 = this.m01_;
  m1 = this.m11_;
  this.m01_ = tx.m00_ * m0 + tx.m01_ * m1;
  this.m11_ = tx.m10_ * m0 + tx.m11_ * m1;
  m0 = this.m02_;
  m1 = this.m12_;
  this.m02_ = tx.m00_ * m0 + tx.m01_ * m1 + tx.m02_;
  this.m12_ = tx.m10_ * m0 + tx.m11_ * m1 + tx.m12_;
  return this
};
goog.graphics.AffineTransform.prototype.transform = function(src, srcOff, dst, dstOff, numPts) {
  var i = srcOff;
  var j = dstOff;
  var srcEnd = srcOff + 2 * numPts;
  while(i < srcEnd) {
    var x = src[i++];
    var y = src[i++];
    dst[j++] = x * this.m00_ + y * this.m01_ + this.m02_;
    dst[j++] = x * this.m10_ + y * this.m11_ + this.m12_
  }
};
goog.graphics.AffineTransform.prototype.getDeterminant = function() {
  return this.m00_ * this.m11_ - this.m01_ * this.m10_
};
goog.graphics.AffineTransform.prototype.isInvertible = function() {
  var det = this.getDeterminant();
  return goog.math.isFiniteNumber(det) && goog.math.isFiniteNumber(this.m02_) && goog.math.isFiniteNumber(this.m12_) && det != 0
};
goog.graphics.AffineTransform.prototype.createInverse = function() {
  var det = this.getDeterminant();
  return new goog.graphics.AffineTransform(this.m11_ / det, -this.m10_ / det, -this.m01_ / det, this.m00_ / det, (this.m01_ * this.m12_ - this.m11_ * this.m02_) / det, (this.m10_ * this.m02_ - this.m00_ * this.m12_) / det)
};
goog.graphics.AffineTransform.getScaleInstance = function(sx, sy) {
  return(new goog.graphics.AffineTransform).setToScale(sx, sy)
};
goog.graphics.AffineTransform.getTranslateInstance = function(dx, dy) {
  return(new goog.graphics.AffineTransform).setToTranslation(dx, dy)
};
goog.graphics.AffineTransform.getShearInstance = function(shx, shy) {
  return(new goog.graphics.AffineTransform).setToShear(shx, shy)
};
goog.graphics.AffineTransform.getRotateInstance = function(theta, x, y) {
  return(new goog.graphics.AffineTransform).setToRotation(theta, x, y)
};
goog.graphics.AffineTransform.prototype.setToScale = function(sx, sy) {
  return this.setTransform(sx, 0, 0, sy, 0, 0)
};
goog.graphics.AffineTransform.prototype.setToTranslation = function(dx, dy) {
  return this.setTransform(1, 0, 0, 1, dx, dy)
};
goog.graphics.AffineTransform.prototype.setToShear = function(shx, shy) {
  return this.setTransform(1, shy, shx, 1, 0, 0)
};
goog.graphics.AffineTransform.prototype.setToRotation = function(theta, x, y) {
  var cos = Math.cos(theta);
  var sin = Math.sin(theta);
  return this.setTransform(cos, sin, -sin, cos, x - x * cos + y * sin, y - x * sin - y * cos)
};
goog.graphics.AffineTransform.prototype.equals = function(tx) {
  if(this == tx) {
    return true
  }
  if(!tx) {
    return false
  }
  return this.m00_ == tx.m00_ && this.m01_ == tx.m01_ && this.m02_ == tx.m02_ && this.m10_ == tx.m10_ && this.m11_ == tx.m11_ && this.m12_ == tx.m12_
};
goog.provide("goog.graphics.Element");
goog.require("goog.events");
goog.require("goog.events.EventTarget");
goog.require("goog.graphics.AffineTransform");
goog.require("goog.math");
goog.graphics.Element = function(element, graphics) {
  goog.events.EventTarget.call(this);
  this.element_ = element;
  this.graphics_ = graphics;
  this.customEvent_ = false
};
goog.inherits(goog.graphics.Element, goog.events.EventTarget);
goog.graphics.Element.prototype.graphics_ = null;
goog.graphics.Element.prototype.element_ = null;
goog.graphics.Element.prototype.transform_ = null;
goog.graphics.Element.prototype.getElement = function() {
  return this.element_
};
goog.graphics.Element.prototype.getGraphics = function() {
  return this.graphics_
};
goog.graphics.Element.prototype.setTransformation = function(x, y, rotate, centerX, centerY) {
  this.transform_ = goog.graphics.AffineTransform.getRotateInstance(goog.math.toRadians(rotate), centerX, centerY).translate(x, y);
  this.getGraphics().setElementTransform(this, x, y, rotate, centerX, centerY)
};
goog.graphics.Element.prototype.getTransform = function() {
  return this.transform_ ? this.transform_.clone() : new goog.graphics.AffineTransform
};
goog.graphics.Element.prototype.addEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.listen(this.element_, type, handler, opt_capture, opt_handlerScope)
};
goog.graphics.Element.prototype.removeEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.unlisten(this.element_, type, handler, opt_capture, opt_handlerScope)
};
goog.graphics.Element.prototype.disposeInternal = function() {
  goog.graphics.Element.superClass_.disposeInternal.call(this);
  goog.events.removeAll(this.element_)
};
goog.provide("goog.graphics.StrokeAndFillElement");
goog.require("goog.graphics.Element");
goog.graphics.StrokeAndFillElement = function(element, graphics, stroke, fill) {
  goog.graphics.Element.call(this, element, graphics);
  this.setStroke(stroke);
  this.setFill(fill)
};
goog.inherits(goog.graphics.StrokeAndFillElement, goog.graphics.Element);
goog.graphics.StrokeAndFillElement.prototype.fill = null;
goog.graphics.StrokeAndFillElement.prototype.stroke_ = null;
goog.graphics.StrokeAndFillElement.prototype.setFill = function(fill) {
  this.fill = fill;
  this.getGraphics().setElementFill(this, fill)
};
goog.graphics.StrokeAndFillElement.prototype.getFill = function() {
  return this.fill
};
goog.graphics.StrokeAndFillElement.prototype.setStroke = function(stroke) {
  this.stroke_ = stroke;
  this.getGraphics().setElementStroke(this, stroke)
};
goog.graphics.StrokeAndFillElement.prototype.getStroke = function() {
  return this.stroke_
};
goog.graphics.StrokeAndFillElement.prototype.reapplyStroke = function() {
  if(this.stroke_) {
    this.setStroke(this.stroke_)
  }
};
goog.provide("goog.graphics.EllipseElement");
goog.require("goog.graphics.StrokeAndFillElement");
goog.graphics.EllipseElement = function(element, graphics, stroke, fill) {
  goog.graphics.StrokeAndFillElement.call(this, element, graphics, stroke, fill)
};
goog.inherits(goog.graphics.EllipseElement, goog.graphics.StrokeAndFillElement);
goog.graphics.EllipseElement.prototype.setCenter = goog.abstractMethod;
goog.graphics.EllipseElement.prototype.setRadius = goog.abstractMethod;
goog.provide("goog.graphics.GroupElement");
goog.require("goog.graphics.Element");
goog.graphics.GroupElement = function(element, graphics) {
  goog.graphics.Element.call(this, element, graphics)
};
goog.inherits(goog.graphics.GroupElement, goog.graphics.Element);
goog.graphics.GroupElement.prototype.clear = goog.abstractMethod;
goog.graphics.GroupElement.prototype.setSize = goog.abstractMethod;
goog.provide("goog.graphics.ImageElement");
goog.require("goog.graphics.Element");
goog.graphics.ImageElement = function(element, graphics) {
  goog.graphics.Element.call(this, element, graphics)
};
goog.inherits(goog.graphics.ImageElement, goog.graphics.Element);
goog.graphics.ImageElement.prototype.setPosition = goog.abstractMethod;
goog.graphics.ImageElement.prototype.setSize = goog.abstractMethod;
goog.graphics.ImageElement.prototype.setSource = goog.abstractMethod;
goog.provide("goog.graphics.PathElement");
goog.require("goog.graphics.StrokeAndFillElement");
goog.graphics.PathElement = function(element, graphics, stroke, fill) {
  goog.graphics.StrokeAndFillElement.call(this, element, graphics, stroke, fill)
};
goog.inherits(goog.graphics.PathElement, goog.graphics.StrokeAndFillElement);
goog.graphics.PathElement.prototype.setPath = goog.abstractMethod;
goog.provide("goog.graphics.RectElement");
goog.require("goog.graphics.StrokeAndFillElement");
goog.graphics.RectElement = function(element, graphics, stroke, fill) {
  goog.graphics.StrokeAndFillElement.call(this, element, graphics, stroke, fill)
};
goog.inherits(goog.graphics.RectElement, goog.graphics.StrokeAndFillElement);
goog.graphics.RectElement.prototype.setPosition = goog.abstractMethod;
goog.graphics.RectElement.prototype.setSize = goog.abstractMethod;
goog.provide("goog.graphics.TextElement");
goog.require("goog.graphics.StrokeAndFillElement");
goog.graphics.TextElement = function(element, graphics, stroke, fill) {
  goog.graphics.StrokeAndFillElement.call(this, element, graphics, stroke, fill)
};
goog.inherits(goog.graphics.TextElement, goog.graphics.StrokeAndFillElement);
goog.graphics.TextElement.prototype.setText = goog.abstractMethod;
goog.provide("goog.graphics.CanvasEllipseElement");
goog.provide("goog.graphics.CanvasGroupElement");
goog.provide("goog.graphics.CanvasImageElement");
goog.provide("goog.graphics.CanvasPathElement");
goog.provide("goog.graphics.CanvasRectElement");
goog.provide("goog.graphics.CanvasTextElement");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.dom.TagName");
goog.require("goog.graphics.EllipseElement");
goog.require("goog.graphics.GroupElement");
goog.require("goog.graphics.ImageElement");
goog.require("goog.graphics.Path");
goog.require("goog.graphics.PathElement");
goog.require("goog.graphics.RectElement");
goog.require("goog.graphics.TextElement");
goog.graphics.CanvasGroupElement = function(graphics) {
  goog.graphics.GroupElement.call(this, null, graphics);
  this.children_ = []
};
goog.inherits(goog.graphics.CanvasGroupElement, goog.graphics.GroupElement);
goog.graphics.CanvasGroupElement.prototype.clear = function() {
  if(this.children_.length) {
    this.children_.length = 0;
    this.getGraphics().redraw()
  }
};
goog.graphics.CanvasGroupElement.prototype.setSize = function(width, height) {
};
goog.graphics.CanvasGroupElement.prototype.appendChild = function(element) {
  this.children_.push(element)
};
goog.graphics.CanvasGroupElement.prototype.draw = function(ctx) {
  for(var i = 0, len = this.children_.length;i < len;i++) {
    this.getGraphics().drawElement(this.children_[i])
  }
};
goog.graphics.CanvasEllipseElement = function(element, graphics, cx, cy, rx, ry, stroke, fill) {
  goog.graphics.EllipseElement.call(this, element, graphics, stroke, fill);
  this.cx_ = cx;
  this.cy_ = cy;
  this.rx_ = rx;
  this.ry_ = ry;
  this.path_ = new goog.graphics.Path;
  this.setUpPath_();
  this.pathElement_ = new goog.graphics.CanvasPathElement(null, graphics, this.path_, stroke, fill)
};
goog.inherits(goog.graphics.CanvasEllipseElement, goog.graphics.EllipseElement);
goog.graphics.CanvasEllipseElement.prototype.setUpPath_ = function() {
  this.path_.clear();
  this.path_.moveTo(this.cx_ + goog.math.angleDx(0, this.rx_), this.cy_ + goog.math.angleDy(0, this.ry_));
  this.path_.arcTo(this.rx_, this.ry_, 0, 360);
  this.path_.close()
};
goog.graphics.CanvasEllipseElement.prototype.setCenter = function(cx, cy) {
  this.cx_ = cx;
  this.cy_ = cy;
  this.setUpPath_();
  this.pathElement_.setPath(this.path_)
};
goog.graphics.CanvasEllipseElement.prototype.setRadius = function(rx, ry) {
  this.rx_ = rx;
  this.ry_ = ry;
  this.setUpPath_();
  this.pathElement_.setPath(this.path_)
};
goog.graphics.CanvasEllipseElement.prototype.draw = function(ctx) {
  this.pathElement_.draw(ctx)
};
goog.graphics.CanvasRectElement = function(element, graphics, x, y, w, h, stroke, fill) {
  goog.graphics.RectElement.call(this, element, graphics, stroke, fill);
  this.x_ = x;
  this.y_ = y;
  this.w_ = w;
  this.h_ = h
};
goog.inherits(goog.graphics.CanvasRectElement, goog.graphics.RectElement);
goog.graphics.CanvasRectElement.prototype.setPosition = function(x, y) {
  this.x_ = x;
  this.y_ = y;
  if(this.drawn_) {
    this.getGraphics().redraw()
  }
};
goog.graphics.CanvasRectElement.prototype.drawn_ = false;
goog.graphics.CanvasRectElement.prototype.setSize = function(width, height) {
  this.w_ = width;
  this.h_ = height;
  if(this.drawn_) {
    this.getGraphics().redraw()
  }
};
goog.graphics.CanvasRectElement.prototype.draw = function(ctx) {
  this.drawn_ = true;
  ctx.beginPath();
  ctx.moveTo(this.x_, this.y_);
  ctx.lineTo(this.x_, this.y_ + this.h_);
  ctx.lineTo(this.x_ + this.w_, this.y_ + this.h_);
  ctx.lineTo(this.x_ + this.w_, this.y_);
  ctx.closePath()
};
goog.graphics.CanvasPathElement = function(element, graphics, path, stroke, fill) {
  goog.graphics.PathElement.call(this, element, graphics, stroke, fill);
  this.setPath(path)
};
goog.inherits(goog.graphics.CanvasPathElement, goog.graphics.PathElement);
goog.graphics.CanvasPathElement.prototype.drawn_ = false;
goog.graphics.CanvasPathElement.prototype.path_;
goog.graphics.CanvasPathElement.prototype.setPath = function(path) {
  this.path_ = path.isSimple() ? path : goog.graphics.Path.createSimplifiedPath(path);
  if(this.drawn_) {
    this.getGraphics().redraw()
  }
};
goog.graphics.CanvasPathElement.prototype.draw = function(ctx) {
  this.drawn_ = true;
  ctx.beginPath();
  this.path_.forEachSegment(function(segment, args) {
    switch(segment) {
      case goog.graphics.Path.Segment.MOVETO:
        ctx.moveTo(args[0], args[1]);
        break;
      case goog.graphics.Path.Segment.LINETO:
        for(var i = 0;i < args.length;i += 2) {
          ctx.lineTo(args[i], args[i + 1])
        }
        break;
      case goog.graphics.Path.Segment.CURVETO:
        for(var i = 0;i < args.length;i += 6) {
          ctx.bezierCurveTo(args[i], args[i + 1], args[i + 2], args[i + 3], args[i + 4], args[i + 5])
        }
        break;
      case goog.graphics.Path.Segment.ARCTO:
        throw Error("Canvas paths cannot contain arcs");;
      case goog.graphics.Path.Segment.CLOSE:
        ctx.closePath();
        break
    }
  })
};
goog.graphics.CanvasTextElement = function(graphics, text, x1, y1, x2, y2, align, font, stroke, fill) {
  var element = goog.dom.createDom(goog.dom.TagName.DIV, {"style":"display:table;position:absolute;padding:0;margin:0;border:0"});
  goog.graphics.TextElement.call(this, element, graphics, stroke, fill);
  this.text_ = text;
  this.x1_ = x1;
  this.y1_ = y1;
  this.x2_ = x2;
  this.y2_ = y2;
  this.align_ = align || "left";
  this.font_ = font;
  this.innerElement_ = goog.dom.createDom("DIV", {"style":"display:table-cell;padding: 0;margin: 0;border: 0"});
  this.updateStyle_();
  this.updateText_();
  graphics.getElement().appendChild(element);
  element.appendChild(this.innerElement_)
};
goog.inherits(goog.graphics.CanvasTextElement, goog.graphics.TextElement);
goog.graphics.CanvasTextElement.prototype.setText = function(text) {
  this.text_ = text;
  this.updateText_()
};
goog.graphics.CanvasTextElement.prototype.setFill = function(fill) {
  this.fill = fill;
  var element = this.getElement();
  if(element) {
    element.style.color = fill.getColor() || fill.getColor1()
  }
};
goog.graphics.CanvasTextElement.prototype.setStroke = function(stroke) {
};
goog.graphics.CanvasTextElement.prototype.draw = function(ctx) {
};
goog.graphics.CanvasTextElement.prototype.updateStyle_ = function() {
  var x1 = this.x1_;
  var x2 = this.x2_;
  var y1 = this.y1_;
  var y2 = this.y2_;
  var align = this.align_;
  var font = this.font_;
  var style = this.getElement().style;
  var scaleX = this.getGraphics().getPixelScaleX();
  var scaleY = this.getGraphics().getPixelScaleY();
  if(x1 == x2) {
    style.lineHeight = "90%";
    this.innerElement_.style.verticalAlign = align == "center" ? "middle" : align == "left" ? y1 < y2 ? "top" : "bottom" : y1 < y2 ? "bottom" : "top";
    style.textAlign = "center";
    var w = font.size * scaleX;
    style.top = Math.round(Math.min(y1, y2) * scaleY) + "px";
    style.left = Math.round((x1 - w / 2) * scaleX) + "px";
    style.width = Math.round(w) + "px";
    style.height = Math.abs(y1 - y2) * scaleY + "px";
    style.fontSize = font.size * 0.6 * scaleY + "pt"
  }else {
    style.lineHeight = "100%";
    this.innerElement_.style.verticalAlign = "top";
    style.textAlign = align;
    style.top = Math.round(((y1 + y2) / 2 - font.size * 2 / 3) * scaleY) + "px";
    style.left = Math.round(x1 * scaleX) + "px";
    style.width = Math.round(Math.abs(x2 - x1) * scaleX) + "px";
    style.height = "auto";
    style.fontSize = font.size * scaleY + "pt"
  }
  style.fontWeight = font.bold ? "bold" : "normal";
  style.fontStyle = font.italic ? "italic" : "normal";
  style.fontFamily = font.family;
  var fill = this.getFill();
  style.color = fill.getColor() || fill.getColor1()
};
goog.graphics.CanvasTextElement.prototype.updateText_ = function() {
  if(this.x1_ == this.x2_) {
    this.innerElement_.innerHTML = goog.array.map(this.text_.split(""), goog.string.htmlEscape).join("<br>")
  }else {
    this.innerElement_.innerHTML = goog.string.htmlEscape(this.text_)
  }
};
goog.graphics.CanvasImageElement = function(element, graphics, x, y, w, h, src) {
  goog.graphics.ImageElement.call(this, element, graphics);
  this.x_ = x;
  this.y_ = y;
  this.w_ = w;
  this.h_ = h;
  this.src_ = src
};
goog.inherits(goog.graphics.CanvasImageElement, goog.graphics.ImageElement);
goog.graphics.CanvasImageElement.prototype.drawn_ = false;
goog.graphics.CanvasImageElement.prototype.setPosition = function(x, y) {
  this.x_ = x;
  this.y_ = y;
  if(this.drawn_) {
    this.getGraphics().redraw()
  }
};
goog.graphics.CanvasImageElement.prototype.setSize = function(width, height) {
  this.w_ = width;
  this.h_ = height;
  if(this.drawn_) {
    this.getGraphics().redraw()
  }
};
goog.graphics.CanvasImageElement.prototype.setSource = function(src) {
  this.src_ = src;
  if(this.drawn_) {
    this.getGraphics().redraw()
  }
};
goog.graphics.CanvasImageElement.prototype.draw = function(ctx) {
  if(this.img_) {
    if(this.w_ && this.h_) {
      ctx.drawImage(this.img_, this.x_, this.y_, this.w_, this.h_)
    }
    this.drawn_ = true
  }else {
    var img = new Image;
    img.onload = goog.bind(this.handleImageLoad_, this, img);
    img.src = this.src_
  }
};
goog.graphics.CanvasImageElement.prototype.handleImageLoad_ = function(img) {
  this.img_ = img;
  this.getGraphics().redraw()
};
goog.provide("goog.graphics.Font");
goog.graphics.Font = function(size, family) {
  this.size = size;
  this.family = family
};
goog.graphics.Font.prototype.bold = false;
goog.graphics.Font.prototype.italic = false;
goog.provide("goog.graphics.Fill");
goog.graphics.Fill = function() {
};
goog.provide("goog.graphics.LinearGradient");
goog.require("goog.asserts");
goog.require("goog.graphics.Fill");
goog.graphics.LinearGradient = function(x1, y1, x2, y2, color1, color2, opt_opacity1, opt_opacity2) {
  this.x1_ = x1;
  this.y1_ = y1;
  this.x2_ = x2;
  this.y2_ = y2;
  this.color1_ = color1;
  this.color2_ = color2;
  goog.asserts.assert(goog.isNumber(opt_opacity1) == goog.isNumber(opt_opacity2), "Both or neither of opt_opacity1 and opt_opacity2 have to be set.");
  this.opacity1_ = goog.isDef(opt_opacity1) ? opt_opacity1 : null;
  this.opacity2_ = goog.isDef(opt_opacity2) ? opt_opacity2 : null
};
goog.inherits(goog.graphics.LinearGradient, goog.graphics.Fill);
goog.graphics.LinearGradient.prototype.getX1 = function() {
  return this.x1_
};
goog.graphics.LinearGradient.prototype.getY1 = function() {
  return this.y1_
};
goog.graphics.LinearGradient.prototype.getX2 = function() {
  return this.x2_
};
goog.graphics.LinearGradient.prototype.getY2 = function() {
  return this.y2_
};
goog.graphics.LinearGradient.prototype.getColor1 = function() {
  return this.color1_
};
goog.graphics.LinearGradient.prototype.getColor2 = function() {
  return this.color2_
};
goog.graphics.LinearGradient.prototype.getOpacity1 = function() {
  return this.opacity1_
};
goog.graphics.LinearGradient.prototype.getOpacity2 = function() {
  return this.opacity2_
};
goog.provide("goog.graphics.SolidFill");
goog.require("goog.graphics.Fill");
goog.graphics.SolidFill = function(color, opt_opacity) {
  this.color_ = color;
  this.opacity_ = opt_opacity || 1
};
goog.inherits(goog.graphics.SolidFill, goog.graphics.Fill);
goog.graphics.SolidFill.prototype.getColor = function() {
  return this.color_
};
goog.graphics.SolidFill.prototype.getOpacity = function() {
  return this.opacity_
};
goog.provide("goog.graphics.Stroke");
goog.graphics.Stroke = function(width, color) {
  this.width_ = width;
  this.color_ = color
};
goog.graphics.Stroke.prototype.getWidth = function() {
  return this.width_
};
goog.graphics.Stroke.prototype.getColor = function() {
  return this.color_
};
goog.provide("goog.graphics.CanvasGraphics");
goog.require("goog.dom");
goog.require("goog.events.EventType");
goog.require("goog.graphics.AbstractGraphics");
goog.require("goog.graphics.CanvasEllipseElement");
goog.require("goog.graphics.CanvasGroupElement");
goog.require("goog.graphics.CanvasImageElement");
goog.require("goog.graphics.CanvasPathElement");
goog.require("goog.graphics.CanvasRectElement");
goog.require("goog.graphics.CanvasTextElement");
goog.require("goog.graphics.Font");
goog.require("goog.graphics.LinearGradient");
goog.require("goog.graphics.SolidFill");
goog.require("goog.graphics.Stroke");
goog.require("goog.math.Size");
goog.graphics.CanvasGraphics = function(width, height, opt_coordWidth, opt_coordHeight, opt_domHelper) {
  goog.graphics.AbstractGraphics.call(this, width, height, opt_coordWidth, opt_coordHeight, opt_domHelper)
};
goog.inherits(goog.graphics.CanvasGraphics, goog.graphics.AbstractGraphics);
goog.graphics.CanvasGraphics.prototype.setElementFill = function(element, fill) {
  this.redraw()
};
goog.graphics.CanvasGraphics.prototype.setElementStroke = function(element, stroke) {
  this.redraw()
};
goog.graphics.CanvasGraphics.prototype.setElementTransform = function(element, x, y, angle, centerX, centerY) {
  this.redraw()
};
goog.graphics.CanvasGraphics.prototype.pushElementTransform = function(element) {
  var ctx = this.getContext();
  ctx.save();
  var transform = element.getTransform();
  var tx = transform.getTranslateX();
  var ty = transform.getTranslateY();
  if(tx || ty) {
    ctx.translate(tx, ty)
  }
  var sinTheta = transform.getShearY();
  if(sinTheta) {
    ctx.rotate(Math.asin(sinTheta))
  }
};
goog.graphics.CanvasGraphics.prototype.popElementTransform = function() {
  this.getContext().restore()
};
goog.graphics.CanvasGraphics.prototype.createDom = function() {
  var element = this.dom_.createDom("div", {"style":"position:relative;overflow:hidden"});
  this.setElementInternal(element);
  this.canvas_ = this.dom_.createDom("canvas");
  element.appendChild(this.canvas_);
  this.canvasElement = new goog.graphics.CanvasGroupElement(this);
  this.lastGroup_ = this.canvasElement;
  this.redrawTimeout_ = 0;
  this.updateSize()
};
goog.graphics.CanvasGraphics.prototype.clearContext_ = function() {
  this.context_ = null
};
goog.graphics.CanvasGraphics.prototype.getContext = function() {
  if(!this.getElement()) {
    this.createDom()
  }
  if(!this.context_) {
    this.context_ = this.canvas_.getContext("2d");
    this.context_.save()
  }
  return this.context_
};
goog.graphics.CanvasGraphics.prototype.setCoordOrigin = function(left, top) {
  this.coordLeft = left;
  this.coordTop = top;
  this.redraw()
};
goog.graphics.CanvasGraphics.prototype.setCoordSize = function(coordWidth, coordHeight) {
  goog.graphics.CanvasGraphics.superClass_.setCoordSize.apply(this, arguments);
  this.redraw()
};
goog.graphics.CanvasGraphics.prototype.setSize = function(pixelWidth, pixelHeight) {
  this.width = pixelWidth;
  this.height = pixelHeight;
  this.updateSize();
  this.redraw()
};
goog.graphics.CanvasGraphics.prototype.getPixelSize = function() {
  var width = this.width;
  var height = this.height;
  var computeWidth = goog.isString(width) && width.indexOf("%") != -1;
  var computeHeight = goog.isString(height) && height.indexOf("%") != -1;
  if(!this.isInDocument() && (computeWidth || computeHeight)) {
    return null
  }
  var parent;
  var parentSize;
  if(computeWidth) {
    parent = this.getElement().parentNode;
    parentSize = goog.style.getSize(parent);
    width = parseFloat(width) * parentSize.width / 100
  }
  if(computeHeight) {
    parent = parent || this.getElement().parentNode;
    parentSize = parentSize || goog.style.getSize(parent);
    height = parseFloat(height) * parentSize.height / 100
  }
  return new goog.math.Size(width, height)
};
goog.graphics.CanvasGraphics.prototype.updateSize = function() {
  goog.style.setSize(this.getElement(), this.width, this.height);
  var pixels = this.getPixelSize();
  if(pixels) {
    goog.style.setSize(this.canvas_, pixels.width, pixels.height);
    this.canvas_.width = pixels.width;
    this.canvas_.height = pixels.height;
    this.clearContext_()
  }
};
goog.graphics.CanvasGraphics.prototype.reset = function() {
  var ctx = this.getContext();
  ctx.restore();
  var size = this.getPixelSize();
  if(size.width && size.height) {
    ctx.clearRect(0, 0, size.width, size.height)
  }
  ctx.save()
};
goog.graphics.CanvasGraphics.prototype.clear = function() {
  this.reset();
  this.canvasElement.clear();
  var el = this.getElement();
  while(el.childNodes.length > 1) {
    el.removeChild(el.lastChild)
  }
};
goog.graphics.CanvasGraphics.prototype.redraw = function() {
  if(this.preventRedraw_) {
    this.needsRedraw_ = true;
    return
  }
  if(this.isInDocument()) {
    this.reset();
    if(this.coordWidth) {
      var pixels = this.getPixelSize();
      this.getContext().scale(pixels.width / this.coordWidth, pixels.height / this.coordHeight)
    }
    if(this.coordLeft || this.coordTop) {
      this.getContext().translate(-this.coordLeft, -this.coordTop)
    }
    this.pushElementTransform(this.canvasElement);
    this.canvasElement.draw(this.context_);
    this.popElementTransform()
  }
};
goog.graphics.CanvasGraphics.prototype.drawElement = function(element) {
  if(element instanceof goog.graphics.CanvasTextElement) {
    return
  }
  var ctx = this.getContext();
  this.pushElementTransform(element);
  if(!element.getFill || !element.getStroke) {
    element.draw(ctx);
    this.popElementTransform();
    return
  }
  var fill = element.getFill();
  if(fill) {
    if(fill instanceof goog.graphics.SolidFill) {
      if(fill.getOpacity() != 0) {
        ctx.globalAlpha = fill.getOpacity();
        ctx.fillStyle = fill.getColor();
        element.draw(ctx);
        ctx.fill();
        ctx.globalAlpha = 1
      }
    }else {
      var linearGradient = ctx.createLinearGradient(fill.getX1(), fill.getY1(), fill.getX2(), fill.getY2());
      linearGradient.addColorStop(0, fill.getColor1());
      linearGradient.addColorStop(1, fill.getColor2());
      ctx.fillStyle = linearGradient;
      element.draw(ctx);
      ctx.fill()
    }
  }
  var stroke = element.getStroke();
  if(stroke) {
    element.draw(ctx);
    ctx.strokeStyle = stroke.getColor();
    var width = stroke.getWidth();
    if(goog.isString(width) && width.indexOf("px") != -1) {
      width = parseFloat(width) / this.getPixelScaleX()
    }
    ctx.lineWidth = width;
    ctx.stroke()
  }
  this.popElementTransform()
};
goog.graphics.CanvasGraphics.prototype.append_ = function(element, group) {
  this.append(element, group)
};
goog.graphics.CanvasGraphics.prototype.append = function(element, group) {
  group = group || this.canvasElement;
  group.appendChild(element);
  if(this.isDrawable(group)) {
    this.drawElement(element)
  }
};
goog.graphics.CanvasGraphics.prototype.drawEllipse = function(cx, cy, rx, ry, stroke, fill, opt_group) {
  var element = new goog.graphics.CanvasEllipseElement(null, this, cx, cy, rx, ry, stroke, fill);
  this.append(element, opt_group);
  return element
};
goog.graphics.CanvasGraphics.prototype.drawRect = function(x, y, width, height, stroke, fill, opt_group) {
  var element = new goog.graphics.CanvasRectElement(null, this, x, y, width, height, stroke, fill);
  this.append(element, opt_group);
  return element
};
goog.graphics.CanvasGraphics.prototype.drawImage = function(x, y, width, height, src, opt_group) {
  var element = new goog.graphics.CanvasImageElement(null, this, x, y, width, height, src);
  this.append(element, opt_group);
  return element
};
goog.graphics.CanvasGraphics.prototype.drawTextOnLine = function(text, x1, y1, x2, y2, align, font, stroke, fill, opt_group) {
  var element = new goog.graphics.CanvasTextElement(this, text, x1, y1, x2, y2, align, font, stroke, fill);
  this.append(element, opt_group);
  return element
};
goog.graphics.CanvasGraphics.prototype.drawPath = function(path, stroke, fill, opt_group) {
  var element = new goog.graphics.CanvasPathElement(null, this, path, stroke, fill);
  this.append(element, opt_group);
  return element
};
goog.graphics.CanvasGraphics.prototype.isDrawable = function(group) {
  return this.isInDocument() && !this.redrawTimeout_ && !this.isRedrawRequired(group)
};
goog.graphics.CanvasGraphics.prototype.isRedrawRequired = function(group) {
  return group != this.canvasElement && group != this.lastGroup_
};
goog.graphics.CanvasGraphics.prototype.createGroup = function(opt_group) {
  var group = new goog.graphics.CanvasGroupElement(this);
  opt_group = opt_group || this.canvasElement;
  if(opt_group == this.canvasElement || opt_group == this.lastGroup_) {
    this.lastGroup_ = group
  }
  this.append(group, opt_group);
  return group
};
goog.graphics.CanvasGraphics.prototype.getTextWidth = goog.abstractMethod;
goog.graphics.CanvasGraphics.prototype.disposeInternal = function() {
  this.context_ = null;
  goog.graphics.CanvasGraphics.superClass_.disposeInternal.call(this)
};
goog.graphics.CanvasGraphics.prototype.enterDocument = function() {
  var oldPixelSize = this.getPixelSize();
  goog.graphics.CanvasGraphics.superClass_.enterDocument.call(this);
  if(!oldPixelSize) {
    this.updateSize();
    this.dispatchEvent(goog.events.EventType.RESIZE)
  }
  this.redraw()
};
goog.graphics.CanvasGraphics.prototype.suspend = function() {
  this.preventRedraw_ = true
};
goog.graphics.CanvasGraphics.prototype.resume = function() {
  this.preventRedraw_ = false;
  if(this.needsRedraw_) {
    this.redraw();
    this.needsRedraw_ = false
  }
};
goog.provide("goog.Timer");
goog.require("goog.events.EventTarget");
goog.Timer = function(opt_interval, opt_timerObject) {
  goog.events.EventTarget.call(this);
  this.interval_ = opt_interval || 1;
  this.timerObject_ = opt_timerObject || goog.Timer.defaultTimerObject;
  this.boundTick_ = goog.bind(this.tick_, this);
  this.last_ = goog.now()
};
goog.inherits(goog.Timer, goog.events.EventTarget);
goog.Timer.MAX_TIMEOUT_ = 2147483647;
goog.Timer.prototype.enabled = false;
goog.Timer.defaultTimerObject = goog.global["window"];
goog.Timer.intervalScale = 0.8;
goog.Timer.prototype.timer_ = null;
goog.Timer.prototype.getInterval = function() {
  return this.interval_
};
goog.Timer.prototype.setInterval = function(interval) {
  this.interval_ = interval;
  if(this.timer_ && this.enabled) {
    this.stop();
    this.start()
  }else {
    if(this.timer_) {
      this.stop()
    }
  }
};
goog.Timer.prototype.tick_ = function() {
  if(this.enabled) {
    var elapsed = goog.now() - this.last_;
    if(elapsed > 0 && elapsed < this.interval_ * goog.Timer.intervalScale) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_ - elapsed);
      return
    }
    this.dispatchTick();
    if(this.enabled) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_);
      this.last_ = goog.now()
    }
  }
};
goog.Timer.prototype.dispatchTick = function() {
  this.dispatchEvent(goog.Timer.TICK)
};
goog.Timer.prototype.start = function() {
  this.enabled = true;
  if(!this.timer_) {
    this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_);
    this.last_ = goog.now()
  }
};
goog.Timer.prototype.stop = function() {
  this.enabled = false;
  if(this.timer_) {
    this.timerObject_.clearTimeout(this.timer_);
    this.timer_ = null
  }
};
goog.Timer.prototype.disposeInternal = function() {
  goog.Timer.superClass_.disposeInternal.call(this);
  this.stop();
  delete this.timerObject_
};
goog.Timer.TICK = "tick";
goog.Timer.callOnce = function(listener, opt_delay, opt_handler) {
  if(goog.isFunction(listener)) {
    if(opt_handler) {
      listener = goog.bind(listener, opt_handler)
    }
  }else {
    if(listener && typeof listener.handleEvent == "function") {
      listener = goog.bind(listener.handleEvent, listener)
    }else {
      throw Error("Invalid listener argument");
    }
  }
  if(opt_delay > goog.Timer.MAX_TIMEOUT_) {
    return-1
  }else {
    return goog.Timer.defaultTimerObject.setTimeout(listener, opt_delay || 0)
  }
};
goog.Timer.clear = function(timerId) {
  goog.Timer.defaultTimerObject.clearTimeout(timerId)
};
goog.provide("goog.graphics.SvgEllipseElement");
goog.provide("goog.graphics.SvgGroupElement");
goog.provide("goog.graphics.SvgImageElement");
goog.provide("goog.graphics.SvgPathElement");
goog.provide("goog.graphics.SvgRectElement");
goog.provide("goog.graphics.SvgTextElement");
goog.require("goog.dom");
goog.require("goog.graphics.EllipseElement");
goog.require("goog.graphics.GroupElement");
goog.require("goog.graphics.ImageElement");
goog.require("goog.graphics.PathElement");
goog.require("goog.graphics.RectElement");
goog.require("goog.graphics.TextElement");
goog.graphics.SvgGroupElement = function(element, graphics) {
  goog.graphics.GroupElement.call(this, element, graphics)
};
goog.inherits(goog.graphics.SvgGroupElement, goog.graphics.GroupElement);
goog.graphics.SvgGroupElement.prototype.clear = function() {
  goog.dom.removeChildren(this.getElement())
};
goog.graphics.SvgGroupElement.prototype.setSize = function(width, height) {
  this.getGraphics().setElementAttributes(this.getElement(), {"width":width, "height":height})
};
goog.graphics.SvgEllipseElement = function(element, graphics, stroke, fill) {
  goog.graphics.EllipseElement.call(this, element, graphics, stroke, fill)
};
goog.inherits(goog.graphics.SvgEllipseElement, goog.graphics.EllipseElement);
goog.graphics.SvgEllipseElement.prototype.setCenter = function(cx, cy) {
  this.getGraphics().setElementAttributes(this.getElement(), {"cx":cx, "cy":cy})
};
goog.graphics.SvgEllipseElement.prototype.setRadius = function(rx, ry) {
  this.getGraphics().setElementAttributes(this.getElement(), {"rx":rx, "ry":ry})
};
goog.graphics.SvgRectElement = function(element, graphics, stroke, fill) {
  goog.graphics.RectElement.call(this, element, graphics, stroke, fill)
};
goog.inherits(goog.graphics.SvgRectElement, goog.graphics.RectElement);
goog.graphics.SvgRectElement.prototype.setPosition = function(x, y) {
  this.getGraphics().setElementAttributes(this.getElement(), {"x":x, "y":y})
};
goog.graphics.SvgRectElement.prototype.setSize = function(width, height) {
  this.getGraphics().setElementAttributes(this.getElement(), {"width":width, "height":height})
};
goog.graphics.SvgPathElement = function(element, graphics, stroke, fill) {
  goog.graphics.PathElement.call(this, element, graphics, stroke, fill)
};
goog.inherits(goog.graphics.SvgPathElement, goog.graphics.PathElement);
goog.graphics.SvgPathElement.prototype.setPath = function(path) {
  this.getGraphics().setElementAttributes(this.getElement(), {"d":goog.graphics.SvgGraphics.getSvgPath(path)})
};
goog.graphics.SvgTextElement = function(element, graphics, stroke, fill) {
  goog.graphics.TextElement.call(this, element, graphics, stroke, fill)
};
goog.inherits(goog.graphics.SvgTextElement, goog.graphics.TextElement);
goog.graphics.SvgTextElement.prototype.setText = function(text) {
  this.getElement().firstChild.data = text
};
goog.graphics.SvgImageElement = function(element, graphics) {
  goog.graphics.ImageElement.call(this, element, graphics)
};
goog.inherits(goog.graphics.SvgImageElement, goog.graphics.ImageElement);
goog.graphics.SvgImageElement.prototype.setPosition = function(x, y) {
  this.getGraphics().setElementAttributes(this.getElement(), {"x":x, "y":y})
};
goog.graphics.SvgImageElement.prototype.setSize = function(width, height) {
  this.getGraphics().setElementAttributes(this.getElement(), {"width":width, "height":height})
};
goog.graphics.SvgImageElement.prototype.setSource = function(src) {
  this.getGraphics().setElementAttributes(this.getElement(), {"xlink:href":src})
};
goog.provide("goog.graphics.SvgGraphics");
goog.require("goog.Timer");
goog.require("goog.dom");
goog.require("goog.events.EventHandler");
goog.require("goog.events.EventType");
goog.require("goog.graphics.AbstractGraphics");
goog.require("goog.graphics.Font");
goog.require("goog.graphics.LinearGradient");
goog.require("goog.graphics.SolidFill");
goog.require("goog.graphics.Stroke");
goog.require("goog.graphics.SvgEllipseElement");
goog.require("goog.graphics.SvgGroupElement");
goog.require("goog.graphics.SvgImageElement");
goog.require("goog.graphics.SvgPathElement");
goog.require("goog.graphics.SvgRectElement");
goog.require("goog.graphics.SvgTextElement");
goog.require("goog.math.Size");
goog.require("goog.style");
goog.require("goog.userAgent");
goog.graphics.SvgGraphics = function(width, height, opt_coordWidth, opt_coordHeight, opt_domHelper) {
  goog.graphics.AbstractGraphics.call(this, width, height, opt_coordWidth, opt_coordHeight, opt_domHelper);
  this.defs_ = {};
  this.useManualViewbox_ = goog.userAgent.WEBKIT && !goog.userAgent.isVersion(526);
  this.handler_ = new goog.events.EventHandler(this)
};
goog.inherits(goog.graphics.SvgGraphics, goog.graphics.AbstractGraphics);
goog.graphics.SvgGraphics.SVG_NS_ = "http://www.w3.org/2000/svg";
goog.graphics.SvgGraphics.DEF_ID_PREFIX_ = "_svgdef_";
goog.graphics.SvgGraphics.nextDefId_ = 0;
goog.graphics.SvgGraphics.prototype.defsElement_;
goog.graphics.SvgGraphics.prototype.createSvgElement_ = function(tagName, opt_attributes) {
  var element = this.dom_.getDocument().createElementNS(goog.graphics.SvgGraphics.SVG_NS_, tagName);
  if(opt_attributes) {
    this.setElementAttributes(element, opt_attributes)
  }
  return element
};
goog.graphics.SvgGraphics.prototype.setElementAttributes = function(element, attributes) {
  for(var key in attributes) {
    element.setAttribute(key, attributes[key])
  }
};
goog.graphics.SvgGraphics.prototype.append_ = function(element, opt_group) {
  var parent = opt_group || this.canvasElement;
  parent.getElement().appendChild(element.getElement())
};
goog.graphics.SvgGraphics.prototype.setElementFill = function(element, fill) {
  var svgElement = element.getElement();
  if(fill instanceof goog.graphics.SolidFill) {
    svgElement.setAttribute("fill", fill.getColor());
    svgElement.setAttribute("fill-opacity", fill.getOpacity())
  }else {
    if(fill instanceof goog.graphics.LinearGradient) {
      var defKey = "lg-" + fill.getX1() + "-" + fill.getY1() + "-" + fill.getX2() + "-" + fill.getY2() + "-" + fill.getColor1() + "-" + fill.getColor2();
      var id = this.getDef_(defKey);
      if(!id) {
        var gradient = this.createSvgElement_("linearGradient", {"x1":fill.getX1(), "y1":fill.getY1(), "x2":fill.getX2(), "y2":fill.getY2(), "gradientUnits":"userSpaceOnUse"});
        var gstyle = "stop-color:" + fill.getColor1();
        if(goog.isNumber(fill.getOpacity1())) {
          gstyle += ";stop-opacity:" + fill.getOpacity1()
        }
        var stop1 = this.createSvgElement_("stop", {"offset":"0%", "style":gstyle});
        gradient.appendChild(stop1);
        gstyle = "stop-color:" + fill.getColor2();
        if(goog.isNumber(fill.getOpacity2())) {
          gstyle += ";stop-opacity:" + fill.getOpacity2()
        }
        var stop2 = this.createSvgElement_("stop", {"offset":"100%", "style":gstyle});
        gradient.appendChild(stop2);
        id = this.addDef_(defKey, gradient)
      }
      svgElement.setAttribute("fill", "url(#" + id + ")")
    }else {
      svgElement.setAttribute("fill", "none")
    }
  }
};
goog.graphics.SvgGraphics.prototype.setElementStroke = function(element, stroke) {
  var svgElement = element.getElement();
  if(stroke) {
    svgElement.setAttribute("stroke", stroke.getColor());
    var width = stroke.getWidth();
    if(goog.isString(width) && width.indexOf("px") != -1) {
      svgElement.setAttribute("stroke-width", parseFloat(width) / this.getPixelScaleX())
    }else {
      svgElement.setAttribute("stroke-width", width)
    }
  }else {
    svgElement.setAttribute("stroke", "none")
  }
};
goog.graphics.SvgGraphics.prototype.setElementTransform = function(element, x, y, angle, centerX, centerY) {
  element.getElement().setAttribute("transform", "translate(" + x + "," + y + ") rotate(" + angle + " " + centerX + " " + centerY + ")")
};
goog.graphics.SvgGraphics.prototype.createDom = function() {
  var attributes = {"width":this.width, "height":this.height, "overflow":"hidden"};
  var svgElement = this.createSvgElement_("svg", attributes);
  var groupElement = this.createSvgElement_("g");
  this.defsElement_ = this.createSvgElement_("defs");
  this.canvasElement = new goog.graphics.SvgGroupElement(groupElement, this);
  svgElement.appendChild(this.defsElement_);
  svgElement.appendChild(groupElement);
  this.setElementInternal(svgElement);
  this.setViewBox_()
};
goog.graphics.SvgGraphics.prototype.setCoordOrigin = function(left, top) {
  this.coordLeft = left;
  this.coordTop = top;
  this.setViewBox_()
};
goog.graphics.SvgGraphics.prototype.setCoordSize = function(coordWidth, coordHeight) {
  goog.graphics.SvgGraphics.superClass_.setCoordSize.apply(this, arguments);
  this.setViewBox_()
};
goog.graphics.SvgGraphics.prototype.getViewBox_ = function() {
  return this.coordLeft + " " + this.coordTop + " " + (this.coordWidth ? this.coordWidth + " " + this.coordHeight : "")
};
goog.graphics.SvgGraphics.prototype.setViewBox_ = function() {
  if(this.coordWidth || this.coordLeft || this.coordTop) {
    this.getElement().setAttribute("preserveAspectRatio", "none");
    if(this.useManualViewbox_) {
      this.updateManualViewBox_()
    }else {
      this.getElement().setAttribute("viewBox", this.getViewBox_())
    }
  }
};
goog.graphics.SvgGraphics.prototype.updateManualViewBox_ = function() {
  if(!this.isInDocument() || !(this.coordWidth || this.coordLeft || !this.coordTop)) {
    return
  }
  var size = this.getPixelSize();
  if(size.width == 0) {
    this.getElement().style.visibility = "hidden";
    return
  }
  this.getElement().style.visibility = "";
  var offsetX = -this.coordLeft;
  var offsetY = -this.coordTop;
  var scaleX = size.width / this.coordWidth;
  var scaleY = size.height / this.coordHeight;
  this.canvasElement.getElement().setAttribute("transform", "scale(" + scaleX + " " + scaleY + ") " + "translate(" + offsetX + " " + offsetY + ")")
};
goog.graphics.SvgGraphics.prototype.setSize = function(pixelWidth, pixelHeight) {
  goog.style.setSize(this.getElement(), pixelWidth, pixelHeight)
};
goog.graphics.SvgGraphics.prototype.getPixelSize = function() {
  if(!goog.userAgent.GECKO) {
    return this.isInDocument() ? goog.style.getSize(this.getElement()) : goog.base(this, "getPixelSize")
  }
  var width = this.width;
  var height = this.height;
  var computeWidth = goog.isString(width) && width.indexOf("%") != -1;
  var computeHeight = goog.isString(height) && height.indexOf("%") != -1;
  if(!this.isInDocument() && (computeWidth || computeHeight)) {
    return null
  }
  var parent;
  var parentSize;
  if(computeWidth) {
    parent = this.getElement().parentNode;
    parentSize = goog.style.getSize(parent);
    width = parseFloat(width) * parentSize.width / 100
  }
  if(computeHeight) {
    parent = parent || this.getElement().parentNode;
    parentSize = parentSize || goog.style.getSize(parent);
    height = parseFloat(height) * parentSize.height / 100
  }
  return new goog.math.Size(width, height)
};
goog.graphics.SvgGraphics.prototype.clear = function() {
  this.canvasElement.clear();
  goog.dom.removeChildren(this.defsElement_);
  this.defs_ = {}
};
goog.graphics.SvgGraphics.prototype.drawEllipse = function(cx, cy, rx, ry, stroke, fill, opt_group) {
  var element = this.createSvgElement_("ellipse", {"cx":cx, "cy":cy, "rx":rx, "ry":ry});
  var wrapper = new goog.graphics.SvgEllipseElement(element, this, stroke, fill);
  this.append_(wrapper, opt_group);
  return wrapper
};
goog.graphics.SvgGraphics.prototype.drawRect = function(x, y, width, height, stroke, fill, opt_group) {
  var element = this.createSvgElement_("rect", {"x":x, "y":y, "width":width, "height":height});
  var wrapper = new goog.graphics.SvgRectElement(element, this, stroke, fill);
  this.append_(wrapper, opt_group);
  return wrapper
};
goog.graphics.SvgGraphics.prototype.drawImage = function(x, y, width, height, src, opt_group) {
  var element = this.createSvgElement_("image", {"x":x, "y":y, "width":width, "height":height, "image-rendering":"optimizeQuality", "preserveAspectRatio":"none"});
  element.setAttributeNS("http://www.w3.org/1999/xlink", "href", src);
  var wrapper = new goog.graphics.SvgImageElement(element, this);
  this.append_(wrapper, opt_group);
  return wrapper
};
goog.graphics.SvgGraphics.prototype.drawTextOnLine = function(text, x1, y1, x2, y2, align, font, stroke, fill, opt_group) {
  var angle = Math.round(goog.math.angle(x1, y1, x2, y2));
  var dx = x2 - x1;
  var dy = y2 - y1;
  var lineLength = Math.round(Math.sqrt(dx * dx + dy * dy));
  var fontSize = font.size;
  var attributes = {"font-family":font.family, "font-size":fontSize};
  var baseline = Math.round(fontSize * 0.85);
  var textY = Math.round(y1 - fontSize / 2 + baseline);
  var textX = x1;
  if(align == "center") {
    textX += Math.round(lineLength / 2);
    attributes["text-anchor"] = "middle"
  }else {
    if(align == "right") {
      textX += lineLength;
      attributes["text-anchor"] = "end"
    }
  }
  attributes["x"] = textX;
  attributes["y"] = textY;
  if(font.bold) {
    attributes["font-weight"] = "bold"
  }
  if(font.italic) {
    attributes["font-style"] = "italic"
  }
  if(angle != 0) {
    attributes["transform"] = "rotate(" + angle + " " + x1 + " " + y1 + ")"
  }
  var element = this.createSvgElement_("text", attributes);
  element.appendChild(this.dom_.getDocument().createTextNode(text));
  if(stroke == null && goog.userAgent.GECKO && goog.userAgent.MAC) {
    var color = "black";
    if(fill instanceof goog.graphics.SolidFill) {
      color = fill.getColor()
    }
    stroke = new goog.graphics.Stroke(1, color)
  }
  var wrapper = new goog.graphics.SvgTextElement(element, this, stroke, fill);
  this.append_(wrapper, opt_group);
  return wrapper
};
goog.graphics.SvgGraphics.prototype.drawPath = function(path, stroke, fill, opt_group) {
  var element = this.createSvgElement_("path", {"d":goog.graphics.SvgGraphics.getSvgPath(path)});
  var wrapper = new goog.graphics.SvgPathElement(element, this, stroke, fill);
  this.append_(wrapper, opt_group);
  return wrapper
};
goog.graphics.SvgGraphics.getSvgPath = function(path) {
  var list = [];
  path.forEachSegment(function(segment, args) {
    switch(segment) {
      case goog.graphics.Path.Segment.MOVETO:
        list.push("M");
        Array.prototype.push.apply(list, args);
        break;
      case goog.graphics.Path.Segment.LINETO:
        list.push("L");
        Array.prototype.push.apply(list, args);
        break;
      case goog.graphics.Path.Segment.CURVETO:
        list.push("C");
        Array.prototype.push.apply(list, args);
        break;
      case goog.graphics.Path.Segment.ARCTO:
        var extent = args[3];
        var toAngle = args[2] + extent;
        list.push("A", args[0], args[1], 0, Math.abs(extent) > 180 ? 1 : 0, extent > 0 ? 1 : 0, args[4], args[5]);
        break;
      case goog.graphics.Path.Segment.CLOSE:
        list.push("Z");
        break
    }
  });
  return list.join(" ")
};
goog.graphics.SvgGraphics.prototype.createGroup = function(opt_group) {
  var element = this.createSvgElement_("g");
  var parent = opt_group || this.canvasElement;
  parent.getElement().appendChild(element);
  return new goog.graphics.SvgGroupElement(element, this)
};
goog.graphics.SvgGraphics.prototype.getTextWidth = function(text, font) {
};
goog.graphics.SvgGraphics.prototype.addDef_ = function(defKey, defElement) {
  if(defKey in this.defs_) {
    return this.defs_[defKey]
  }
  var id = goog.graphics.SvgGraphics.DEF_ID_PREFIX_ + goog.graphics.SvgGraphics.nextDefId_++;
  defElement.setAttribute("id", id);
  this.defs_[defKey] = id;
  var defs = this.defsElement_;
  defs.appendChild(defElement);
  return id
};
goog.graphics.SvgGraphics.prototype.getDef_ = function(defKey) {
  return defKey in this.defs_ ? this.defs_[defKey] : null
};
goog.graphics.SvgGraphics.prototype.enterDocument = function() {
  var oldPixelSize = this.getPixelSize();
  goog.graphics.SvgGraphics.superClass_.enterDocument.call(this);
  if(!oldPixelSize) {
    this.dispatchEvent(goog.events.EventType.RESIZE)
  }
  if(this.useManualViewbox_) {
    var width = this.width;
    var height = this.height;
    if(typeof width == "string" && width.indexOf("%") != -1 && typeof height == "string" && height.indexOf("%") != -1) {
      this.handler_.listen(goog.graphics.SvgGraphics.getResizeCheckTimer_(), goog.Timer.TICK, this.updateManualViewBox_)
    }
    this.updateManualViewBox_()
  }
};
goog.graphics.SvgGraphics.prototype.exitDocument = function() {
  goog.graphics.SvgGraphics.superClass_.exitDocument.call(this);
  if(this.useManualViewbox_) {
    this.handler_.unlisten(goog.graphics.SvgGraphics.getResizeCheckTimer_(), goog.Timer.TICK, this.updateManualViewBox_)
  }
};
goog.graphics.SvgGraphics.prototype.disposeInternal = function() {
  delete this.defs_;
  delete this.defsElement_;
  delete this.canvasElement;
  goog.graphics.SvgGraphics.superClass_.disposeInternal.call(this)
};
goog.graphics.SvgGraphics.resizeCheckTimer_;
goog.graphics.SvgGraphics.getResizeCheckTimer_ = function() {
  if(!goog.graphics.SvgGraphics.resizeCheckTimer_) {
    goog.graphics.SvgGraphics.resizeCheckTimer_ = new goog.Timer(400);
    goog.graphics.SvgGraphics.resizeCheckTimer_.start()
  }
  return goog.graphics.SvgGraphics.resizeCheckTimer_
};
goog.graphics.SvgGraphics.prototype.isDomClonable = function() {
  return true
};
goog.provide("goog.graphics.VmlEllipseElement");
goog.provide("goog.graphics.VmlGroupElement");
goog.provide("goog.graphics.VmlImageElement");
goog.provide("goog.graphics.VmlPathElement");
goog.provide("goog.graphics.VmlRectElement");
goog.provide("goog.graphics.VmlTextElement");
goog.require("goog.dom");
goog.require("goog.graphics.EllipseElement");
goog.require("goog.graphics.GroupElement");
goog.require("goog.graphics.ImageElement");
goog.require("goog.graphics.PathElement");
goog.require("goog.graphics.RectElement");
goog.require("goog.graphics.TextElement");
goog.graphics.vmlGetElement_ = function() {
  this.element_ = this.getGraphics().getVmlElement(this.id_) || this.element_;
  return this.element_
};
goog.graphics.VmlGroupElement = function(element, graphics) {
  this.id_ = element.id;
  goog.graphics.GroupElement.call(this, element, graphics)
};
goog.inherits(goog.graphics.VmlGroupElement, goog.graphics.GroupElement);
goog.graphics.VmlGroupElement.prototype.getElement = goog.graphics.vmlGetElement_;
goog.graphics.VmlGroupElement.prototype.clear = function() {
  goog.dom.removeChildren(this.getElement())
};
goog.graphics.VmlGroupElement.prototype.isRootElement_ = function() {
  return this.getGraphics().getCanvasElement() == this
};
goog.graphics.VmlGroupElement.prototype.setSize = function(width, height) {
  var element = this.getElement();
  var style = element.style;
  style.width = goog.graphics.VmlGraphics.toSizePx(width);
  style.height = goog.graphics.VmlGraphics.toSizePx(height);
  element.coordsize = goog.graphics.VmlGraphics.toSizeCoord(width) + " " + goog.graphics.VmlGraphics.toSizeCoord(height);
  if(!this.isRootElement_()) {
    element.coordorigin = "0 0"
  }
};
goog.graphics.VmlEllipseElement = function(element, graphics, cx, cy, rx, ry, stroke, fill) {
  this.id_ = element.id;
  goog.graphics.EllipseElement.call(this, element, graphics, stroke, fill);
  this.cx = cx;
  this.cy = cy;
  this.rx = rx;
  this.ry = ry
};
goog.inherits(goog.graphics.VmlEllipseElement, goog.graphics.EllipseElement);
goog.graphics.VmlEllipseElement.prototype.getElement = goog.graphics.vmlGetElement_;
goog.graphics.VmlEllipseElement.prototype.setCenter = function(cx, cy) {
  this.cx = cx;
  this.cy = cy;
  goog.graphics.VmlGraphics.setPositionAndSize(this.getElement(), cx - this.rx, cy - this.ry, this.rx * 2, this.ry * 2)
};
goog.graphics.VmlEllipseElement.prototype.setRadius = function(rx, ry) {
  this.rx = rx;
  this.ry = ry;
  goog.graphics.VmlGraphics.setPositionAndSize(this.getElement(), this.cx - rx, this.cy - ry, rx * 2, ry * 2)
};
goog.graphics.VmlRectElement = function(element, graphics, stroke, fill) {
  this.id_ = element.id;
  goog.graphics.RectElement.call(this, element, graphics, stroke, fill)
};
goog.inherits(goog.graphics.VmlRectElement, goog.graphics.RectElement);
goog.graphics.VmlRectElement.prototype.getElement = goog.graphics.vmlGetElement_;
goog.graphics.VmlRectElement.prototype.setPosition = function(x, y) {
  var style = this.getElement().style;
  style.left = goog.graphics.VmlGraphics.toPosPx(x);
  style.top = goog.graphics.VmlGraphics.toPosPx(y)
};
goog.graphics.VmlRectElement.prototype.setSize = function(width, height) {
  var style = this.getElement().style;
  style.width = goog.graphics.VmlGraphics.toSizePx(width);
  style.height = goog.graphics.VmlGraphics.toSizePx(height)
};
goog.graphics.VmlPathElement = function(element, graphics, stroke, fill) {
  this.id_ = element.id;
  goog.graphics.PathElement.call(this, element, graphics, stroke, fill)
};
goog.inherits(goog.graphics.VmlPathElement, goog.graphics.PathElement);
goog.graphics.VmlPathElement.prototype.getElement = goog.graphics.vmlGetElement_;
goog.graphics.VmlPathElement.prototype.setPath = function(path) {
  goog.graphics.VmlGraphics.setAttribute(this.getElement(), "path", goog.graphics.VmlGraphics.getVmlPath(path))
};
goog.graphics.VmlTextElement = function(element, graphics, stroke, fill) {
  this.id_ = element.id;
  goog.graphics.TextElement.call(this, element, graphics, stroke, fill)
};
goog.inherits(goog.graphics.VmlTextElement, goog.graphics.TextElement);
goog.graphics.VmlTextElement.prototype.getElement = goog.graphics.vmlGetElement_;
goog.graphics.VmlTextElement.prototype.setText = function(text) {
  goog.graphics.VmlGraphics.setAttribute(this.getElement().childNodes[1], "string", text)
};
goog.graphics.VmlImageElement = function(element, graphics) {
  this.id_ = element.id;
  goog.graphics.ImageElement.call(this, element, graphics)
};
goog.inherits(goog.graphics.VmlImageElement, goog.graphics.ImageElement);
goog.graphics.VmlImageElement.prototype.getElement = goog.graphics.vmlGetElement_;
goog.graphics.VmlImageElement.prototype.setPosition = function(x, y) {
  var style = this.getElement().style;
  style.left = goog.graphics.VmlGraphics.toPosPx(x);
  style.top = goog.graphics.VmlGraphics.toPosPx(y)
};
goog.graphics.VmlImageElement.prototype.setSize = function(width, height) {
  var style = this.getElement().style;
  style.width = goog.graphics.VmlGraphics.toPosPx(width);
  style.height = goog.graphics.VmlGraphics.toPosPx(height)
};
goog.graphics.VmlImageElement.prototype.setSource = function(src) {
  goog.graphics.VmlGraphics.setAttribute(this.getElement(), "src", src)
};
goog.provide("goog.graphics.VmlGraphics");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.events.EventHandler");
goog.require("goog.events.EventType");
goog.require("goog.graphics.AbstractGraphics");
goog.require("goog.graphics.Font");
goog.require("goog.graphics.LinearGradient");
goog.require("goog.graphics.SolidFill");
goog.require("goog.graphics.Stroke");
goog.require("goog.graphics.VmlEllipseElement");
goog.require("goog.graphics.VmlGroupElement");
goog.require("goog.graphics.VmlImageElement");
goog.require("goog.graphics.VmlPathElement");
goog.require("goog.graphics.VmlRectElement");
goog.require("goog.graphics.VmlTextElement");
goog.require("goog.math.Size");
goog.require("goog.string");
goog.require("goog.style");
goog.graphics.VmlGraphics = function(width, height, opt_coordWidth, opt_coordHeight, opt_domHelper) {
  goog.graphics.AbstractGraphics.call(this, width, height, opt_coordWidth, opt_coordHeight, opt_domHelper);
  this.handler_ = new goog.events.EventHandler(this)
};
goog.inherits(goog.graphics.VmlGraphics, goog.graphics.AbstractGraphics);
goog.graphics.VmlGraphics.VML_PREFIX_ = "g_vml_";
goog.graphics.VmlGraphics.VML_NS_ = "urn:schemas-microsoft-com:vml";
goog.graphics.VmlGraphics.VML_IMPORT_ = "#default#VML";
goog.graphics.VmlGraphics.IE8_MODE_ = document.documentMode && document.documentMode >= 8;
goog.graphics.VmlGraphics.COORD_MULTIPLIER = 100;
goog.graphics.VmlGraphics.toCssSize = function(size) {
  return goog.isString(size) && goog.string.endsWith(size, "%") ? size : parseFloat(size.toString()) + "px"
};
goog.graphics.VmlGraphics.toPosCoord = function(number) {
  return Math.round((parseFloat(number.toString()) - 0.5) * goog.graphics.VmlGraphics.COORD_MULTIPLIER)
};
goog.graphics.VmlGraphics.toPosPx = function(number) {
  return goog.graphics.VmlGraphics.toPosCoord(number) + "px"
};
goog.graphics.VmlGraphics.toSizeCoord = function(number) {
  return Math.round(parseFloat(number.toString()) * goog.graphics.VmlGraphics.COORD_MULTIPLIER)
};
goog.graphics.VmlGraphics.toSizePx = function(number) {
  return goog.graphics.VmlGraphics.toSizeCoord(number) + "px"
};
goog.graphics.VmlGraphics.setAttribute = function(element, name, value) {
  if(goog.graphics.VmlGraphics.IE8_MODE_) {
    element[name] = value
  }else {
    element.setAttribute(name, value)
  }
};
goog.graphics.VmlGraphics.prototype.handler_;
goog.graphics.VmlGraphics.prototype.createVmlElement = function(tagName) {
  var element = this.dom_.createElement(goog.graphics.VmlGraphics.VML_PREFIX_ + ":" + tagName);
  element.id = goog.string.createUniqueString();
  return element
};
goog.graphics.VmlGraphics.prototype.getVmlElement = function(id) {
  return this.dom_.getElement(id)
};
goog.graphics.VmlGraphics.prototype.updateGraphics_ = function() {
  if(goog.graphics.VmlGraphics.IE8_MODE_ && this.isInDocument()) {
    this.getElement().innerHTML = this.getElement().innerHTML
  }
};
goog.graphics.VmlGraphics.prototype.append_ = function(element, opt_group) {
  var parent = opt_group || this.canvasElement;
  parent.getElement().appendChild(element.getElement());
  this.updateGraphics_()
};
goog.graphics.VmlGraphics.prototype.setElementFill = function(element, fill) {
  var vmlElement = element.getElement();
  this.removeFill(vmlElement);
  if(fill instanceof goog.graphics.SolidFill) {
    if(fill.getColor() == "transparent") {
      vmlElement.filled = false
    }else {
      if(fill.getOpacity() != 1) {
        vmlElement.filled = true;
        var fillNode = this.createVmlElement("fill");
        fillNode.opacity = Math.round(fill.getOpacity() * 100) + "%";
        fillNode.color = fill.getColor();
        vmlElement.appendChild(fillNode)
      }else {
        vmlElement.filled = true;
        vmlElement.fillcolor = fill.getColor()
      }
    }
  }else {
    if(fill instanceof goog.graphics.LinearGradient) {
      vmlElement.filled = true;
      var gradient = this.createVmlElement("fill");
      gradient.color = fill.getColor1();
      gradient.color2 = fill.getColor2();
      if(goog.isNumber(fill.getOpacity1())) {
        gradient.opacity = fill.getOpacity1()
      }
      if(goog.isNumber(fill.getOpacity2())) {
        gradient.opacity2 = fill.getOpacity2()
      }
      var angle = goog.math.angle(fill.getX1(), fill.getY1(), fill.getX2(), fill.getY2());
      angle = Math.round(goog.math.standardAngle(270 - angle));
      gradient.angle = angle;
      gradient.type = "gradient";
      vmlElement.appendChild(gradient)
    }else {
      vmlElement.filled = false
    }
  }
  this.updateGraphics_()
};
goog.graphics.VmlGraphics.prototype.setElementStroke = function(element, stroke) {
  var vmlElement = element.getElement();
  if(stroke) {
    vmlElement.stroked = true;
    var width = stroke.getWidth();
    if(goog.isString(width) && width.indexOf("px") == -1) {
      width = parseFloat(width)
    }else {
      width = width * this.getPixelScaleX()
    }
    var strokeElement = vmlElement.getElementsByTagName("stroke")[0];
    if(width < 1) {
      strokeElement = strokeElement || this.createVmlElement("stroke");
      strokeElement.opacity = width;
      strokeElement.weight = "1px";
      strokeElement.color = stroke.getColor();
      vmlElement.appendChild(strokeElement)
    }else {
      if(strokeElement) {
        vmlElement.removeChild(strokeElement)
      }
      vmlElement.strokecolor = stroke.getColor();
      vmlElement.strokeweight = width + "px"
    }
  }else {
    vmlElement.stroked = false
  }
  this.updateGraphics_()
};
goog.graphics.VmlGraphics.prototype.setElementTransform = function(element, x, y, angle, centerX, centerY) {
  var el = element.getElement();
  el.style.left = goog.graphics.VmlGraphics.toPosPx(x);
  el.style.top = goog.graphics.VmlGraphics.toPosPx(y);
  if(angle || el.rotation) {
    el.rotation = angle;
    el.coordsize = goog.graphics.VmlGraphics.toSizeCoord(centerX * 2) + " " + goog.graphics.VmlGraphics.toSizeCoord(centerY * 2)
  }
};
goog.graphics.VmlGraphics.prototype.removeFill = function(element) {
  element.fillcolor = "";
  var v = element.childNodes.length;
  for(var i = 0;i < element.childNodes.length;i++) {
    var child = element.childNodes[i];
    if(child.tagName == "fill") {
      element.removeChild(child)
    }
  }
};
goog.graphics.VmlGraphics.setPositionAndSize = function(element, left, top, width, height) {
  var style = element.style;
  style.position = "absolute";
  style.left = goog.graphics.VmlGraphics.toPosPx(left);
  style.top = goog.graphics.VmlGraphics.toPosPx(top);
  style.width = goog.graphics.VmlGraphics.toSizePx(width);
  style.height = goog.graphics.VmlGraphics.toSizePx(height);
  if(element.tagName == "shape") {
    element.coordsize = goog.graphics.VmlGraphics.toSizeCoord(width) + " " + goog.graphics.VmlGraphics.toSizeCoord(height)
  }
};
goog.graphics.VmlGraphics.prototype.createFullSizeElement_ = function(type) {
  var element = this.createVmlElement(type);
  var size = this.getCoordSize();
  goog.graphics.VmlGraphics.setPositionAndSize(element, 0, 0, size.width, size.height);
  return element
};
try {
  eval("document.namespaces")
}catch(ex) {
}
goog.graphics.VmlGraphics.prototype.createDom = function() {
  var doc = this.dom_.getDocument();
  if(!doc.namespaces[goog.graphics.VmlGraphics.VML_PREFIX_]) {
    if(goog.graphics.VmlGraphics.IE8_MODE_) {
      doc.namespaces.add(goog.graphics.VmlGraphics.VML_PREFIX_, goog.graphics.VmlGraphics.VML_NS_, goog.graphics.VmlGraphics.VML_IMPORT_)
    }else {
      doc.namespaces.add(goog.graphics.VmlGraphics.VML_PREFIX_, goog.graphics.VmlGraphics.VML_NS_)
    }
    var ss = doc.createStyleSheet();
    ss.cssText = goog.graphics.VmlGraphics.VML_PREFIX_ + "\\:*" + "{behavior:url(#default#VML)}"
  }
  var pixelWidth = this.width;
  var pixelHeight = this.height;
  var divElement = this.dom_.createDom("div", {"style":"overflow:hidden;position:relative;width:" + goog.graphics.VmlGraphics.toCssSize(pixelWidth) + ";height:" + goog.graphics.VmlGraphics.toCssSize(pixelHeight)});
  this.setElementInternal(divElement);
  var group = this.createVmlElement("group");
  var style = group.style;
  style.position = "absolute";
  style.left = style.top = 0;
  style.width = this.width;
  style.height = this.height;
  if(this.coordWidth) {
    group.coordsize = goog.graphics.VmlGraphics.toSizeCoord(this.coordWidth) + " " + goog.graphics.VmlGraphics.toSizeCoord(this.coordHeight)
  }else {
    group.coordsize = goog.graphics.VmlGraphics.toSizeCoord(pixelWidth) + " " + goog.graphics.VmlGraphics.toSizeCoord(pixelHeight)
  }
  if(goog.isDef(this.coordLeft)) {
    group.coordorigin = goog.graphics.VmlGraphics.toSizeCoord(this.coordLeft) + " " + goog.graphics.VmlGraphics.toSizeCoord(this.coordTop)
  }else {
    group.coordorigin = "0 0"
  }
  divElement.appendChild(group);
  this.canvasElement = new goog.graphics.VmlGroupElement(group, this);
  goog.events.listen(divElement, goog.events.EventType.RESIZE, goog.bind(this.handleContainerResize_, this))
};
goog.graphics.VmlGraphics.prototype.handleContainerResize_ = function() {
  var size = goog.style.getSize(this.getElement());
  var style = this.canvasElement.getElement().style;
  if(size.width) {
    style.width = size.width + "px";
    style.height = size.height + "px"
  }else {
    var current = this.getElement();
    while(current && current.currentStyle && current.currentStyle.display != "none") {
      current = current.parentNode
    }
    if(current && current.currentStyle) {
      this.handler_.listen(current, "propertychange", this.handleContainerResize_)
    }
  }
  this.dispatchEvent(goog.events.EventType.RESIZE)
};
goog.graphics.VmlGraphics.prototype.handlePropertyChange_ = function(e) {
  var prop = e.getBrowserEvent().propertyName;
  if(prop == "display" || prop == "className") {
    this.handler_.unlisten(e.target, "propertychange", this.handlePropertyChange_);
    this.handleContainerResize_()
  }
};
goog.graphics.VmlGraphics.prototype.setCoordOrigin = function(left, top) {
  this.coordLeft = left;
  this.coordTop = top;
  this.canvasElement.getElement().coordorigin = goog.graphics.VmlGraphics.toSizeCoord(this.coordLeft) + " " + goog.graphics.VmlGraphics.toSizeCoord(this.coordTop)
};
goog.graphics.VmlGraphics.prototype.setCoordSize = function(coordWidth, coordHeight) {
  goog.graphics.VmlGraphics.superClass_.setCoordSize.apply(this, arguments);
  this.canvasElement.getElement().coordsize = goog.graphics.VmlGraphics.toSizeCoord(coordWidth) + " " + goog.graphics.VmlGraphics.toSizeCoord(coordHeight)
};
goog.graphics.VmlGraphics.prototype.setSize = function(pixelWidth, pixelHeight) {
  goog.style.setSize(this.getElement(), pixelWidth, pixelHeight)
};
goog.graphics.VmlGraphics.prototype.getPixelSize = function() {
  var el = this.getElement();
  return new goog.math.Size(el.style.pixelWidth || el.offsetWidth || 1, el.style.pixelHeight || el.offsetHeight || 1)
};
goog.graphics.VmlGraphics.prototype.clear = function() {
  this.canvasElement.clear()
};
goog.graphics.VmlGraphics.prototype.drawEllipse = function(cx, cy, rx, ry, stroke, fill, opt_group) {
  var element = this.createVmlElement("oval");
  goog.graphics.VmlGraphics.setPositionAndSize(element, cx - rx, cy - ry, rx * 2, ry * 2);
  var wrapper = new goog.graphics.VmlEllipseElement(element, this, cx, cy, rx, ry, stroke, fill);
  this.append_(wrapper, opt_group);
  return wrapper
};
goog.graphics.VmlGraphics.prototype.drawRect = function(x, y, width, height, stroke, fill, opt_group) {
  var element = this.createVmlElement("rect");
  goog.graphics.VmlGraphics.setPositionAndSize(element, x, y, width, height);
  var wrapper = new goog.graphics.VmlRectElement(element, this, stroke, fill);
  this.append_(wrapper, opt_group);
  return wrapper
};
goog.graphics.VmlGraphics.prototype.drawImage = function(x, y, width, height, src, opt_group) {
  var element = this.createVmlElement("image");
  goog.graphics.VmlGraphics.setPositionAndSize(element, x, y, width, height);
  goog.graphics.VmlGraphics.setAttribute(element, "src", src);
  var wrapper = new goog.graphics.VmlImageElement(element, this);
  this.append_(wrapper, opt_group);
  return wrapper
};
goog.graphics.VmlGraphics.prototype.drawTextOnLine = function(text, x1, y1, x2, y2, align, font, stroke, fill, opt_group) {
  var shape = this.createFullSizeElement_("shape");
  var pathElement = this.createVmlElement("path");
  var path = "M" + goog.graphics.VmlGraphics.toPosCoord(x1) + "," + goog.graphics.VmlGraphics.toPosCoord(y1) + "L" + goog.graphics.VmlGraphics.toPosCoord(x2) + "," + goog.graphics.VmlGraphics.toPosCoord(y2) + "E";
  goog.graphics.VmlGraphics.setAttribute(pathElement, "v", path);
  goog.graphics.VmlGraphics.setAttribute(pathElement, "textpathok", "true");
  var textPathElement = this.createVmlElement("textpath");
  textPathElement.setAttribute("on", "true");
  var style = textPathElement.style;
  style.fontSize = font.size * this.getPixelScaleX();
  style.fontFamily = font.family;
  if(align != null) {
    style["v-text-align"] = align
  }
  if(font.bold) {
    style.fontWeight = "bold"
  }
  if(font.italic) {
    style.fontStyle = "italic"
  }
  goog.graphics.VmlGraphics.setAttribute(textPathElement, "string", text);
  shape.appendChild(pathElement);
  shape.appendChild(textPathElement);
  var wrapper = new goog.graphics.VmlTextElement(shape, this, stroke, fill);
  this.append_(wrapper, opt_group);
  return wrapper
};
goog.graphics.VmlGraphics.prototype.drawPath = function(path, stroke, fill, opt_group) {
  var element = this.createFullSizeElement_("shape");
  goog.graphics.VmlGraphics.setAttribute(element, "path", goog.graphics.VmlGraphics.getVmlPath(path));
  var wrapper = new goog.graphics.VmlPathElement(element, this, stroke, fill);
  this.append_(wrapper, opt_group);
  return wrapper
};
goog.graphics.VmlGraphics.getVmlPath = function(path) {
  var list = [];
  path.forEachSegment(function(segment, args) {
    switch(segment) {
      case goog.graphics.Path.Segment.MOVETO:
        list.push("m");
        Array.prototype.push.apply(list, goog.array.map(args, goog.graphics.VmlGraphics.toSizeCoord));
        break;
      case goog.graphics.Path.Segment.LINETO:
        list.push("l");
        Array.prototype.push.apply(list, goog.array.map(args, goog.graphics.VmlGraphics.toSizeCoord));
        break;
      case goog.graphics.Path.Segment.CURVETO:
        list.push("c");
        Array.prototype.push.apply(list, goog.array.map(args, goog.graphics.VmlGraphics.toSizeCoord));
        break;
      case goog.graphics.Path.Segment.CLOSE:
        list.push("x");
        break;
      case goog.graphics.Path.Segment.ARCTO:
        var toAngle = args[2] + args[3];
        var cx = goog.graphics.VmlGraphics.toSizeCoord(args[4] - goog.math.angleDx(toAngle, args[0]));
        var cy = goog.graphics.VmlGraphics.toSizeCoord(args[5] - goog.math.angleDy(toAngle, args[1]));
        var rx = goog.graphics.VmlGraphics.toSizeCoord(args[0]);
        var ry = goog.graphics.VmlGraphics.toSizeCoord(args[1]);
        var fromAngle = Math.round(args[2] * -65536);
        var extent = Math.round(args[3] * -65536);
        list.push("ae", cx, cy, rx, ry, fromAngle, extent);
        break
    }
  });
  return list.join(" ")
};
goog.graphics.VmlGraphics.prototype.createGroup = function(opt_group) {
  var element = this.createFullSizeElement_("group");
  var parent = opt_group || this.canvasElement;
  parent.getElement().appendChild(element);
  return new goog.graphics.VmlGroupElement(element, this)
};
goog.graphics.VmlGraphics.prototype.getTextWidth = function(text, font) {
  return 0
};
goog.graphics.VmlGraphics.prototype.enterDocument = function() {
  goog.graphics.VmlGraphics.superClass_.enterDocument.call(this);
  this.handleContainerResize_();
  this.updateGraphics_()
};
goog.graphics.VmlGraphics.prototype.disposeInternal = function() {
  this.canvasElement = null;
  goog.graphics.VmlGraphics.superClass_.disposeInternal.call(this)
};
goog.provide("goog.graphics");
goog.require("goog.graphics.CanvasGraphics");
goog.require("goog.graphics.SvgGraphics");
goog.require("goog.graphics.VmlGraphics");
goog.require("goog.userAgent");
goog.graphics.createGraphics = function(width, height, opt_coordWidth, opt_coordHeight, opt_domHelper) {
  var graphics;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("9")) {
    graphics = new goog.graphics.VmlGraphics(width, height, opt_coordWidth, opt_coordHeight, opt_domHelper)
  }else {
    if(goog.userAgent.WEBKIT && (!goog.userAgent.isVersion("420") || goog.userAgent.MOBILE)) {
      graphics = new goog.graphics.CanvasGraphics(width, height, opt_coordWidth, opt_coordHeight, opt_domHelper)
    }else {
      graphics = new goog.graphics.SvgGraphics(width, height, opt_coordWidth, opt_coordHeight, opt_domHelper)
    }
  }
  graphics.createDom();
  return graphics
};
goog.graphics.createSimpleGraphics = function(width, height, opt_coordWidth, opt_coordHeight, opt_domHelper) {
  if(goog.userAgent.MAC && goog.userAgent.GECKO && !goog.userAgent.isVersion("1.9a")) {
    var graphics = new goog.graphics.CanvasGraphics(width, height, opt_coordWidth, opt_coordHeight, opt_domHelper);
    graphics.createDom();
    return graphics
  }
  return goog.graphics.createGraphics(width, height, opt_coordWidth, opt_coordHeight, opt_domHelper)
};
goog.graphics.isBrowserSupported = function() {
  if(goog.userAgent.IE) {
    return goog.userAgent.isVersion("5.5")
  }
  if(goog.userAgent.GECKO) {
    return goog.userAgent.isVersion("1.8")
  }
  if(goog.userAgent.OPERA) {
    return goog.userAgent.isVersion("9.0")
  }
  if(goog.userAgent.WEBKIT) {
    return goog.userAgent.isVersion("412")
  }
  return false
};
goog.provide("ch1.wallpaper");
goog.require("cljs.core");
goog.require("goog.dom");
goog.require("goog.graphics");
NodeList.prototype.cljs$core$ISeqable$ = true;
NodeList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  return cljs.core.doall.call(null, cljs.core.map.call(null, function(p1__6125_SHARP_) {
    return this$.item(p1__6125_SHARP_)
  }, cljs.core.range.call(null, this$.length)))
};
ch1.wallpaper.game_window = goog.graphics.createGraphics(800, 800);
ch1.wallpaper.stroke = new goog.graphics.Stroke(0, "#FFF");
ch1.wallpaper.fill = new goog.graphics.SolidFill("black");
ch1.wallpaper.draw_point_BANG_ = function draw_point_BANG_(canvas, x, y) {
  return canvas.drawRect(4 * x, 4 * y, 4, 4, ch1.wallpaper.stroke, ch1.wallpaper.fill)
};
ch1.wallpaper.wallpaper_BANG_ = function wallpaper_BANG_(canvas, side) {
  canvas.clear();
  var n__2551__auto____6132 = 100;
  var i__6133 = 0;
  while(true) {
    if(i__6133 < n__2551__auto____6132) {
      var x__6134 = i__6133 * (side / 100);
      var n__2551__auto____6135 = 100;
      var j__6136 = 0;
      while(true) {
        if(j__6136 < n__2551__auto____6135) {
          var y__6137 = j__6136 * (side / 100);
          if(cljs.core.even_QMARK_.call(null, Math.floor(x__6134 * x__6134 + y__6137 * y__6137))) {
            ch1.wallpaper.draw_point_BANG_.call(null, canvas, x__6134, y__6137)
          }else {
          }
          var G__6138 = j__6136 + 1;
          j__6136 = G__6138;
          continue
        }else {
        }
        break
      }
      var G__6139 = i__6133 + 1;
      i__6133 = G__6139;
      continue
    }else {
      return null
    }
    break
  }
};
ch1.wallpaper.serialize_inputs = function serialize_inputs(form_el) {
  var inputs__6141 = form_el.querySelectorAll("input");
  return cljs.core.reduce.call(null, function(m, el) {
    return cljs.core.assoc.call(null, m, cljs.core.keyword.call(null, el.getAttribute("name")), el.value)
  }, cljs.core.ObjMap.EMPTY, inputs__6141)
};
ch1.wallpaper.nan_QMARK_ = function nan_QMARK_(x) {
  var and__3822__auto____6143 = cljs.core.number_QMARK_.call(null, x);
  if(and__3822__auto____6143) {
    return cljs.core.not_EQ_.call(null, x, x)
  }else {
    return and__3822__auto____6143
  }
};
ch1.wallpaper.update_canvas = function update_canvas(canvas, form_el, event) {
  var inputs__6146 = ch1.wallpaper.serialize_inputs.call(null, form_el);
  var side__6147 = parseInt((new cljs.core.Keyword("\ufdd0'side")).call(null, inputs__6146));
  if(cljs.core.truth_(cljs.core.some.call(null, ch1.wallpaper.nan_QMARK_, ch1.wallpaper.int_inputs))) {
    alert("ETNER SOME NUMMAS")
  }else {
    ch1.wallpaper.wallpaper_BANG_.call(null, canvas, side__6147)
  }
  return false
};
window.onload = function() {
  var dimensions_form__6148 = goog.dom.getElement("dimensions");
  dimensions_form__6148.onsubmit = cljs.core.partial.call(null, ch1.wallpaper.update_canvas, ch1.wallpaper.game_window, dimensions_form__6148);
  return ch1.wallpaper.game_window.render()
};
