// tslint:disable:no-console

import * as glob from 'glob';
import * as path from 'path';
import * as ts from 'typescript';
import { Docs, Method, Methods, Tags } from '../docs/src/ts/types';

const CWD = process.cwd();
// tslint:disable-next-line:no-var-requires
const COMPILER_OPTIONS = require(path.join(CWD, 'tsconfig.json'));

const serializeTags = (tags: ts.JSDocTagInfo[]): Tags => {
  const ret: Tags = {};

  for (const tag of tags) {
    ret[tag.name] = tag.text;
  }

  return ret;
};

const getTypeAlias = (type: ts.Type, checker: ts.TypeChecker): string | null => {
  if (type.aliasSymbol) {
    return (type.aliasSymbol.getDeclarations()[0] as ts.TypeAliasDeclaration).type.getText();
  }

  // const typeNode = checker.typeToTypeNode(type);

  // if (typeNode.kind === ts.SyntaxKind.TypeReference && type.symbol) {
  //   console.log((type.symbol.members));
  // }

  return null;
};

const serializeParameter = (symbol: ts.Symbol, checker: ts.TypeChecker) => {
  const name = symbol.getName();
  const type = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration as ts.Declaration);
  const typeName = checker.typeToString(type);
  const alias = getTypeAlias(type, checker);

  return {
    name,
    type: alias ? alias : typeName,
    optional: checker.isOptionalParameter(symbol.valueDeclaration as ts.ParameterDeclaration),
  };
};

const serializeNode = (node: ts.PropertyDeclaration, checker: ts.TypeChecker): Method => {
  const symbol = checker.getSymbolAtLocation(node.name);
  const name = symbol.getName();
  const description = ts.displayPartsToString(symbol.getDocumentationComment());
  const type = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration as ts.Declaration);
  const signatures = checker.getSignaturesOfType(type, ts.SignatureKind.Call);
  const tags = serializeTags(symbol.getJsDocTags());

  return {
    name,
    description,
    tags,
    signatures: signatures.map((signature) => {
      const returnType = checker.getReturnTypeOfSignature(signature);
      const returnAlias = getTypeAlias(returnType, checker);

      return {
        parameters: signature.parameters.map((parameter) => serializeParameter(parameter, checker)),
        returns: returnAlias ? returnAlias : checker.typeToString(returnType),
      };
    }),
  };
};

const getMethods = (sourceFiles: ts.SourceFile[], checker: ts.TypeChecker): Methods => {
  const methods: Methods = [];

  const documentProperty = (node: ts.Node) => {
    const flags = ts.getCombinedModifierFlags(node);

    if (
      node.kind === ts.SyntaxKind.PropertyDeclaration &&
      // tslint:disable-next-line:no-bitwise
      (flags & ts.ModifierFlags.Public) !== 0
    ) {
      const initializer = (node as ts.PropertyDeclaration).initializer;
      const name = (node as ts.PropertyDeclaration).name.getText();

      if (initializer && initializer.kind === ts.SyntaxKind.ArrowFunction) {
        const method = serializeNode(node as ts.PropertyDeclaration, checker);

        methods.push(method);
      } else {
        console.error(`Property ${name} is public, but not an arrow function`);
      }
    }
  };

  const traverse = (node: ts.Node) => {
    const flags = ts.getCombinedModifierFlags(node);
    if (
      node.kind === ts.SyntaxKind.ClassDeclaration &&
      // tslint:disable-next-line:no-bitwise
      (flags & ts.ModifierFlags.Export) !== 0 && (flags & ts.ModifierFlags.Default) !== 0
    ) {
      ts.forEachChild(node, documentProperty);
    } else {
      ts.forEachChild(node, (subNode) => {
        traverse(subNode);
      });
    }
  };

  sourceFiles.forEach(traverse);

  return methods;
};

const groupMethods = (methods: Methods): Docs => {
  const foundGroups: string[] = [];
  const foundAliases: string[] = [];
  const docs: Docs = [];

  for (const method of methods) {
    if (foundAliases.indexOf(method.name) >= 0) {
      continue;
    }

    const { name, description, tags, signatures } = method;
    const { alias, group, description: groupDescription } = tags;

    if (alias) {
      if (foundAliases.indexOf(alias) >= 0) {
        console.error(`Duplicate alias ${alias} on method ${name}`);
      } else {
        foundAliases.push(alias);
      }
    }

    let groupIndex = group ? foundGroups.indexOf(group) : foundGroups.length - 1;

    if (group && groupIndex < 0) {
      if (!groupDescription) {
        console.error(`No description for group ${group}`);
      } else {
        groupIndex = foundGroups.length;
        foundGroups.push(group);
        docs.push({
          name: group,
          description: groupDescription,
          methods: [],
        });
      }
    }

    if (groupIndex >= 0 && groupIndex < foundGroups.length) {
      docs[groupIndex].methods.push({
        name,
        description,
        alias,
        signatures,
      });
    }
  }

  return docs;
};

const getDocJson = (): Docs => {
  const sourceFileNames = glob.sync('src/**/*.{js,jsx,ts,tsx}');
  const program = ts.createProgram(sourceFileNames, COMPILER_OPTIONS);
  const sourceFiles = program.getSourceFiles();
  const checker = program.getTypeChecker();

  return groupMethods(getMethods(sourceFiles, checker));
};

export default getDocJson;
