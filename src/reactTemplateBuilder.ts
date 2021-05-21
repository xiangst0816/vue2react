import template from '@babel/template';
import * as t from '@babel/types';
import { formatComponentName } from './utils/tools';

import { App } from './utils/types';

export default function reactTemplateBuilder(app: App) {
  const componentTemplate = `
    export default class NAME extends Component {
      constructor(props) {
        super(props);
        this.state=STATE;
      }
      _styleStringToObject (styleInput) {
        return (styleInput||'').split(';').filter(i=>i&&i.trim()).reduce(function (ruleMap, ruleString) {
          const rulePair = ruleString.split(':');
          ruleMap[rulePair[0].trim()] = rulePair[1].trim();
          return ruleMap;
        }, {});         
      }
    }
  `;

  const buildRequire = template(componentTemplate);

  const node = buildRequire({
    NAME: t.identifier(formatComponentName(app.script.name)),
    STATE: t.objectExpression(app.script.data._statements || [])
  });

  return t.file(t.program([node as any]));
}
