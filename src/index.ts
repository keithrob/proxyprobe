#!/usr/bin/env node
import * as httpm from "typed-rest-client/HttpClient";
import * as ifm from "typed-rest-client/Interfaces";
import * as ap from "argparse/lib/argparse";
import chalk from "chalk"

const VERSION = "1.0.0";
const PROGNAME = "proxyprobe";

async function probeURI(
  uri: string,
  proxyuri?: string,
  ignoreselfsigned = true,
  proxyUsername?: string,
  proxyPassword?: string,
  caFile?: string,
  passphrase?: string
) {
  let userAgent: string = PROGNAME;
  let options: ifm.IRequestOptions;
  if (proxyuri){
    options = <ifm.IRequestOptions>{
      ignoreSslError: ignoreselfsigned,
      cert: {
        caFile: caFile,
        passphrase: passphrase
      },
      proxy: {
        proxyPassword: proxyPassword,
        proxyUrl: proxyuri,
        proxyUsername: proxyPassword
      }
    };
  }

  let httpc: httpm.HttpClient = new httpm.HttpClient(userAgent, [], options);
  try {
    let res: httpm.HttpClientResponse = await httpc.get(uri);

    let body: string = await res.readBody();

    let data = {
      request: {
        header: res.message.req._header,
        proxyOptions: res.message.req.agent.proxyOptions
      },
      response: {
        statusCode: res.message.statusCode,
        statusMessage: res.message.statusMessage,
        // UNABLE_TO_VERIFY_LEAF_SIGNATURE usually means self signed cert.
        authorizationError: res.message.socket.authorizationError,
        header: res.message.headers,
        httpVersion: res.message.httpVersion,
        body: body
      }
    };
    console.log(JSON.stringify(data, null, 4));
  } catch (error) {
    if (error.code && error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'){
      console.error(`${chalk.red.bold('ERROR:')} Your proxy is probably expressing a self signed cert.  You
either need to ignoreselfsined or supply a CA file that isn't self signed.`)
    }
    console.error(error);
  }
}

//
// MAIN
//

let parser = new ap.ArgumentParser({
  version: VERSION,
  addHelp: true,
  description: `A triage tool for validating your proxy settings.  It will
attempt to egress traffic through your proxy and will print as many details
as possible to assist with debug.`,
  prog: PROGNAME
});
parser.addArgument(["-p", "--proxy"], {
  help: "The URI of your proxy server."
});
parser.addArgument(["-d", "--dest"], {
  help: `The URI that you would like to probe through your proxy server.
  The default is https://httpbin.org/get.`,
  defaultValue: "https://httpbin.org/get"
});
parser.addArgument(["-i", "--ignoreselfsigned"], {
  help: `By default, this tool ignores the certificate expressed by your proxy server because
  most corporate proxies are using self signed certificates.  Setting this flag will cause this
  client to STOP ignoring self signed certs.  If you set this you probably need to supply
  cafile.`,
  // See: https://github.com/nodejs/node/blob/e570ae79f5b1d74fed52d2aed7f014caaa0836dd/lib/_tls_wrap.js#L1112
  defaultValue: true,
  action: 'storeFalse'
});
parser.addArgument(["-u", "--user"], {
  help: "The user that you should authenticate to your proxy server as."
});
parser.addArgument(["-P", "--password"], {
  help:
    "The password to your proxy server. Please clear your shell history if you use this."
});
parser.addArgument(["-c", "--cafile"], {
  help:
    `A path to a file containing one or multiple Certificate Authority signing
    certificates. This value is ignored, by default, because ignoreselfsigned=True.
    When ignoreselfsigned is true this client will ignore your proxy server's
    certificate and implicitly trust it. Hence, a cafile is moot.
    If you want to use this you need to set "-i" which will tell this client
    to stop ignoring server certificates and you need to supply a
    cafile that isn't self signed.`
});
parser.addArgument(["-s", "--capassphrase"], {
  help:
    `The secret for your encrypted CA file.
    Please clear your shell history if you use this.`
});

let args = parser.parseArgs();

let msg;
if (args["proxy"]){
  msg = `${chalk.green('INFO:')} Probing ${args["dest"]} through ${args["proxy"]}`;
}else{
  msg = `${chalk.yellow('WARNING:')} Probing ${args["dest"]} directly because you did not specify a
proxy.  If you can reach ${args["dest"]} it means that your network isn't
forcing you to egress traffic through a proxy.  This may or may not be
desirable.`;
}
console.log(`${chalk.green('********************************************************************************')}`);
console.log(msg);
console.log(`${chalk.green('********************************************************************************')}\n`);
probeURI(args["dest"],
         args["proxy"],
         args["ignoreselfsigned"],
         args["user"],
         args["password"],
         args["cafile"]);
