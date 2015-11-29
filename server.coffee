http = require 'http'
async = require 'async'
url = require 'url'

Client = require('node-rest-client').Client
request=require 'request'

#Summary=require('./summary.coffee').Summary
# 9770103
Summary=require('./summary.js').Summary

express=require 'express'
app=express()


class QueryString

    constructor: (@queryString) ->
        @variables = @queryString.split '&'
        @pairs = ([key, value] = pair.split '=' for pair in @variables)

    get: (name) ->
        for [key, value] in @pairs
            return value if key is name



fixarrays = (g) ->
    g.standings=[]
    g.turns=[]
    for i in [0..(g.numberOfTurns)]
        g.standings.push g["standing#{i}"]
        delete g["standing#{i}"]

    for i in [0..(g.numberOfTurns-1)]
        t=g["turn#{i}"]

        xt=
            date: null
            orders: []

        index=0
        for o,j in t
            if j==0
                xt.date=o.date
            else
                xo=
                    type: Object.keys(o)[0]
                    index: index
                for k,v of o[xo.type]
                    xo[k]=v
                xt.orders.push xo
                index++

        g.turns.push xt
        delete g["turn#{i}"]

    g


fixjson = (json) ->
    json=json.split(',').join(' ,')
    j=json
    t=j
    t=t.split(/\s+/)
    w=[]

    o=""
    i=0
    while i<t.length
        o+="#{i}: #{t[i]}\n"
        i++
    

    i=0

    while i<t.length
        
        if t[i].match /"turn\d+"/
            #console.log("turn: #{i} #{t[i]}")
            w.push t[i]
            w.push ':'
            w.push '['
            w.push '{'
            
            bc=0
            
            i+=3

            while (not ((t[i]=='}') and (bc==0)))
                start=i
                #console.log "b: #{i} #{bc} #{t[i]}"
                #break if i>=start+20
                #break
                if ((t[i]==',') and (bc==0))
                    w.push '}'
                    w.push ','
                    w.push '{'
                else
                    bc++ if (t[i]=='{')
                    bc-- if (t[i]=='}') 
                    w.push t[i]
                i++
            
            w.push '}'
            w.push ']'
            
        else
            #console.log("#{i}: #{t[i]}")
            w.push t[i]
        
        i++
        
    #j=w.join('')
    j=w.join(' ')
    j=JSON.parse(j)

    j=fixarrays(j)

    j=JSON.stringify(j,null,4)

    j

    
getGame = (id,callback) ->
    args=
        url: "http://warlight.net/API/Gamefeed.aspx?gameid=#{id}&gethistory=true"
        method: "POST"
        headers:
            'Content-Type': 'text/plain'
        body: "Email=dan.bellandi%40gmail.com&APIToken=YUKScGQ1llHQCD%40OrNslw5R9kCxPJCe%23Y0e81"
        


    response=request args, (error,response,body) ->
            console.log("response finished")
            callback fixjson(body.toString())


handleRequest = (req,res) ->
    try
        uri=url.parse(req.url)
        if not uri.query
            res.writeHead 200, {'Content-Type': 'text/plain'}
            res.end 'use /summary?id=[gameid]>'
            return
        qry=new QueryString(uri.query)
        #console.log uri.toString() unless uri.pathname=='/favicon.ico'

        if uri.pathname=='/game'
            getGame qry.get('id'), (output) ->
                res.writeHead 200, {'Content-Type': 'application/json'}
                res.end output

        else if uri.pathname=='/summary'
            getGame qry.get('id'), (output) ->
                try
                    summary=new Summary(output)
                    res.writeHead 200, {'Content-Type': 'text/plain'}
                    res.end summary.getText()
                catch error
                    console.log "error"
                    console.log error
                    res.writeHead 500
                    res.end error.toString()
                finally
        else
            res.writeHead 200, {'Content-Type': 'text/plain'}
            res.end 'use /summary?id=[gameid]>'
        #console.log "url: #{req.url}"


startServer = () ->

    runPort=process.env.PORT || 8080

#    http.createServer (req, res) ->
#        try
#            uri=url.parse(req.url)
#            if not uri.query
#                return
#            qry=new QueryString(uri.query)
#            console.log uri.toString()
#
#            if uri.pathname=='/game'
#                getGame qry.get('id'), (output) ->
#                    res.writeHead 200, {'Content-Type': 'application/json'}
#                    res.end output
#
#            else if uri.pathname=='/summary'
#                getGame qry.get('id'), (output) ->
#                    try
#                        summary=new Summary(output)
#                        res.writeHead 200, {'Content-Type': 'text/plain'}
#                        res.end summary.getText()
#                    catch error
#                        console.log "error"
#                        console.log error
#                        res.writeHead 500
#                        res.end error.toString()
#        finally
#            console.log "url: #{req.url}"

    #.listen 8080, '127.0.0.1'

    http.createServer handleRequest
    .listen runPort
    console.log "Server running on #{runPort}"


app.get /.*/, (req,res) ->
    console.log "request: #{req.url}" unless req.url=='/favicon.ico'
    handleRequest req,res

startApp = () ->
    server=app.listen process.env.PORT || 8080, () ->
        host=server.address().address
        port=server.address().port
        console.log "app listening at http://#{host}:#{port}"





testSummary = () ->

    getSummary 0,(output) ->
        output
        summary=new Summary(output)
        summary



# main

#startServer()
startApp()
#testSummary()
