# proxyprobe

Triage tool to egress traffic through your proxy and print all response codes, messages, body, etc.

# TOC

-   [proxyprobe](#proxyprobe)
-   [TOC](#toc)
-   [Usage](#usage)
-   [PROTIPs](#protips)
-   [Help](#help)
-   [Examples](#examples)
    -   [Probe Through A Proxy](#probe-through-a-proxy)
    -   [Probe Directly](#probe-directly)

# Usage

This is a simple HTTP/S client that will attempt to probe a given URI via your proxy. It will
print as many attributes of the attempted connection as possible to help triage connection issues.

In general, you will want to probe a URI by going through your proxy server
(e.g. `proxyprobe -p http://my.corporate.proxy.example.com -d https://httpbin.org/get`). However,
you may also want to probe the target URI directly to test whether or not you
are forced to egress traffic through your proxy.

# PROTIPs

Pay attention to the 'code' that gets thrown in the exception when this client fails to
reach the given destination (e.g. `at TLSSocket._finishInit (_tls_wrap.js:635:8) code: 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY'`). This code is also printed in the response
on successful connections and is _sometimes_ (e.g. `"authorizationError": "UNABLE_TO_VERIFY_LEAF_SIGNATURE"`) set by the TCP stack.

Two usual suspects are:

-   UNABLE_TO_VERIFY_LEAF_SIGNATURE: This is usually indicates that your proxy is expressing a
    self signed certificate or that the CA you supplied (i.e. --CAFILE) file isn't understood.  CA
    files for Node need to be in PEM format (for windows users this is Base64 encoded).
    You can bypass this in your code by unsetting [rejectUnauthorized](https://nodejs.org/api/https.html#https_https_request_options_callback).
    Please do not unset rejectUnauthorized in production code as you are
    blindly trusting every certificate your target(s) is expressing.

-   UNABLE_TO_GET_ISSUER_CERT_LOCALLY: The usually indicates that your proxy is MITMing you
    and that you need to trust its CA signing certificate. One way to do this at the process
    level is to set [NODE_EXTRA_CA_CERTS](https://nodejs.org/api/cli.html#cli_node_extra_ca_certs_file).

# Help

```
usage: proxyprobe [-h] [-v] [-p PROXY] [-d DEST] [-i] [-u USER] [-P PASSWORD]
                  [-c CAFILE] [-s CAPASSPHRASE]


A triage tool for validating your proxy settings. It will attempt to egress
traffic through your proxy and will print as many details as possible to
assist with debug.

Optional arguments:
  -h, --help            Show this help message and exit.
  -v, --version         Show program's version number and exit.
  -p PROXY, --proxy PROXY
                        The URI of your proxy server.
  -d DEST, --dest DEST  The URI that you would like to probe through your
                        proxy server. The default is https://httpbin.org/get.
  -i, --ignoreselfsigned
                        By default, this tool ignores the certificate
                        expressed by your proxy server. If you set this you
                        probably need to supply cafile.
  -u USER, --user USER  The user that you should authenticate to your proxy
                        server as.
  -P PASSWORD, --password PASSWORD
                        The password to your proxy server. Please clear your
                        shell history if you use this.
  -c CAFILE, --cafile CAFILE
                        A path to a file containing one or multiple
                        Certificate Authority signing certificates. This
                        value is ignored, by default, because
                        ignoreselfsigned=True. When ignoreselfsigned is true
                        this client will ignore your proxy server's
                        certificate and implicitly trust it. Hence, a cafile
                        is moot. If you want to use this you need to set "-i"
                        which will tell this client to stop ignoring server
                        certificates and you need to supply a cafile that
                        isn't self signed.
  -s CAPASSPHRASE, --capassphrase CAPASSPHRASE
                        The secret for your encrypted CA file. Please clear
                        your shell history if you use this.
```

# Examples

## Probe Through A Proxy

```
> proxyprobe.cmd -p http://127.0.0.1:8888
********************************************************************************
INFO: Probing https://httpbin.org/get through http://127.0.0.1:8888
********************************************************************************

{
    "request": {
        "header": "GET /get HTTP/1.1\r\nUser-Agent: proxyprobe\r\nHost: httpbin.org:443\r\nConnection: close\r\n\r\n",
        "proxyOptions": {
            "host": "127.0.0.1",
            "port": "8888"
        }
    },
    "response": {
        "statusCode": 200,
        "statusMessage": "OK",
        "authorizationError": "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
        "header": {
            "connection": "close",
            "server": "gunicorn/19.9.0",
            "date": "Wed, 22 Aug 2018 20:36:24 GMT",
            "content-type": "application/json",
            "content-length": "194",
            "access-control-allow-origin": "*",
            "access-control-allow-credentials": "true",
            "via": "1.1 vegur"
        },
        "httpVersion": "1.1",
        "body": "{\n  \"args\": {}, \n  \"headers\": {\n    \"Connection\": \"close\", \n    \"Host\": \"httpbin.org\", \n    \"User-Agent\": \"proxyprobe\"\n  }, \n  \"origin\": \"131.107.160.117\", \n  \"url\": \"https://httpbin.org/get\"\n}\n"
    }
}
```

## Probe Directly

```
> proxyprobe.cmd -d https://httpbin.org/get
********************************************************************************
WARNING: Probing https://httpbin.org/get directly because you did not specify a
proxy.  If you can reach https://httpbin.org/get it means that your network isn't
forcing you to egress traffic through a proxy.  This may or may not be
desirable.
********************************************************************************

{
    "request": {
        "header": "GET /get HTTP/1.1\r\nUser-Agent: proxyprobe\r\nHost: httpbin.org\r\nConnection: close\r\n\r\n"
    },
    "response": {
        "statusCode": 200,
        "statusMessage": "OK",
        "authorizationError": null,
        "header": {
            "connection": "close",
            "server": "gunicorn/19.9.0",
            "date": "Wed, 22 Aug 2018 20:37:37 GMT",
            "content-type": "application/json",
            "content-length": "194",
            "access-control-allow-origin": "*",
            "access-control-allow-credentials": "true",
            "via": "1.1 vegur"
        },
        "httpVersion": "1.1",
        "body": "{\n  \"args\": {}, \n  \"headers\": {\n    \"Connection\": \"close\", \n    \"Host\": \"httpbin.org\", \n    \"User-Agent\": \"proxyprobe\"\n  }, \n  \"origin\": \"131.107.160.117\", \n  \"url\": \"https://httpbin.org/get\"\n}\n"
    }
}
```
