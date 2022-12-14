'use strict';

class ViewHelper {

  static getViewsFromUri(uri) {
    const result = [];

    const segments = uri.split('/');
    if (segments.length && segments[0] !== 'ytmusic') {
      return result;
    }

    const splitSegment = (s) => {
      const result = {};
      const ss = s.split('@');
      ss.forEach((sss) => {
        const equalPos = sss.indexOf('=');
        if (equalPos < 0) {
          result.name = sss;
        }
        else {
          let key = sss.substr(0, equalPos);
          let value = sss.substr(equalPos + 1);

          if (value === this.NULL_VALUE_PLACEHOLDER) {
            value = null;
          }

          result[key] = value;
        }
      });

      return result;
    };

    segments.forEach((segment, index) => {
      let data;
      if (index === 0) { // 'ytmusic/...'
        data = {
          name: 'root'
        };
      }
      else {
        data = splitSegment(segment);
      }
      result.push(data);
    });

    return result;
  }

  static filter(views, propertyValues) {
    return views.filter((view) => {
      for (const [prop, value] of Object.entries(propertyValues)) {
        if (view[prop] !== value) {
          return false;
        }
      }
      return true;
    });
  }
}

ViewHelper.NULL_VALUE_PLACEHOLDER = '###NULL###';

module.exports = ViewHelper;
