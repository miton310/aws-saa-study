// Extracts SVG from aws-react-icons compiled JS and writes to public/icons/aws/
const React = { createElement: (t, p, ...c) => ({ t, p, c }) };

const icons = {
  ec2: require('../node_modules/aws-react-icons/lib/icons/ArchitectureServiceAmazonEC2.js'),
  ami: require('../node_modules/aws-react-icons/lib/icons/ResourceAmazonEC2AMI.js'),
  igw: require('../node_modules/aws-react-icons/lib/icons/ResourceAmazonVPCInternetGateway.js'),
  nat: require('../node_modules/aws-react-icons/lib/icons/ResourceAmazonVPCNATGateway.js'),
  vpc: require('../node_modules/aws-react-icons/lib/icons/ResourceAmazonVPCVirtualprivatecloudVPC.js'),
  publicSubnet: require('../node_modules/aws-react-icons/lib/icons/ArchitectureGroupPublicsubnet.js'),
  privateSubnet: require('../node_modules/aws-react-icons/lib/icons/ArchitectureGroupPrivatesubnet.js'),
  tgw: require('../node_modules/aws-react-icons/lib/icons/ArchitectureServiceAWSTransitGateway.js'),
  s3: require('../node_modules/aws-react-icons/lib/icons/ArchitectureServiceAmazonSimpleStorageService.js'),
};

function toSvg(node) {
  if (node === null || node === undefined) return '';
  if (typeof node !== 'object') return String(node);
  const type = node.type;
  if (!type) return '';
  const props = node.props || {};
  const children = props.children;
  const attrs = Object.entries(props)
    .filter(([k]) => k !== 'children')
    .map(([k, v]) => {
      if (k === 'className') return 'class=' + JSON.stringify(v);
      if (v === null || v === undefined || v === false) return '';
      if (v === true) return k;
      return k + '=' + JSON.stringify(String(v));
    })
    .filter(Boolean)
    .join(' ');
  const inner = Array.isArray(children)
    ? children.flat().map(toSvg).join('')
    : toSvg(children);
  return '<' + type + (attrs ? ' ' + attrs : '') + '>' + inner + '</' + type + '>';
}

const fs = require('fs');
fs.mkdirSync('./public/icons/aws', { recursive: true });

for (const [name, mod] of Object.entries(icons)) {
  const fn = mod.default ?? mod;
  const tree = fn({ size: 64 });
  const svg = toSvg(tree);
  fs.writeFileSync('./public/icons/aws/' + name + '.svg', svg);
  console.log('wrote public/icons/aws/' + name + '.svg');
}
