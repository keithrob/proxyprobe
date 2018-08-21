#!/usr/bin/env node
import * as httpm from "typed-rest-client/HttpClient";
import * as ifm from "typed-rest-client/Interfaces";
import * as ap from "argparse/lib/argparse";

const VERSION = "1.0.0";

async function probeURI(
  uri: string,
  proxyuri: string,
  ignoreselfsigned: boolean,
  proxyUsername?: string,
  proxyPassword?: string,
  caFile?: string
) {
  let userAgent: string = "proxyprobe";
  let options: ifm.IRequestOptions = <ifm.IRequestOptions>{
    ignoreSslError: ignoreselfsigned,
    cert: {
      caFile: caFile
    },
    proxy: {
      proxyPassword: proxyPassword,
      proxyUrl: proxyuri,
      proxyUsername: proxyPassword
    }
  };
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
      console.error(`ERROR: Your proxy is probably expressing a self signed cert.  You
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
as possible to assist with debug.`
});
parser.addArgument(["-p", "--proxy"], {
  help: "proxy http://my.corporate.proxy.example.com/",
  required: true
});
parser.addArgument(["-d", "--dest"], {
  help: "dest https://httpbin.org/get (DEFAULT is https://httpbin.org/get)",
  defaultValue: "https://httpbin.org/get"
});
parser.addArgument(["-i", "--ignoreselfsigned"], {
  help: `ignoreselfsigned (This will STOP ignoring self signed certs.  We ignore them
  by default because it is unlikely that your proxy is expressing officially signed
  certs.  If you set this you probably need to supply cafile depending on your cert
  chain.)`,
  // See: https://github.com/nodejs/node/blob/e570ae79f5b1d74fed52d2aed7f014caaa0836dd/lib/_tls_wrap.js#L1112
  defaultValue: true,
  action: 'storeFalse'
});
parser.addArgument(["-u", "--user"], {
  help: "user user@example.com"
});
parser.addArgument(["-P", "--password"], {
  help:
    "password secret (IMPORTANT: Please clear your shell history if you use this)"
});
parser.addArgument(["-c", "--cafile"], {
  help:
    `cafile /path/to/cafile.cer (IMPORTANT: by default, this value is ignored because
    ignoreselfsigned=True.  It is all or nothing.  Either you're ignoring certs or you
    supply ones that aren't self signed.)`
});

let args = parser.parseArgs();


probeURI(args["dest"],
         args["proxy"],
         args["ignoreselfsigned"],
         args["user"],
         args["password"],
         args["cafile"]);
