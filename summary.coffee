"use strict"

Array::sum = (fn = (x) -> x) ->
    @reduce ((a, b) -> a + fn b), 0

class SummarySection
    notes: []
    moves: []
    header: null
    bonuses: []

    constructor: () ->
        @notes=[]
        @moves=[]
        @expands=[]
        @header=null
        @events=[]

    getHeaderText: () =>
        r=(if @header.turn==0 then '[After Distribution]' else "[Turn #{@header.turn}]")
        if @notes.length
            r+=' '+@notes.join('')
        r

    getBodyText: () =>
        r=''
        ee=(e for e in @events when e instanceof Expand and e.bonus not in (x.bonus for x in @events when x instanceof Capture and x.player==e.player)).sort (a,b) ->
            a.player.id<b.player.id

        #r+=(e.getText() for e in ee when not (for x in @events when x instanceof Capture and x.player==e.player and x.bonus==e.bonus).length).join('\n')
        r+=(e.getText() for e in ee).join('')
        r+=(e.getText() for e in @events when e instanceof Capture).join('')
        r+=(e.getText() for e in @events when e instanceof KnockoutFail).join('')
        r+=(e.getText() for e in @events when e instanceof Knockout).join('')
        r+=(e.getText() for e in @events when e instanceof BreakFail).join('')
        r+=(e.getText() for e in @events when e instanceof Break).join('')
        r

    getText: () =>
        @getHeaderText()+'\n'+@getBodyText()+'\n'



class Summary
    data: null
    map: null
    id: null
    turnCount: null
    players: {}
    allPlayers: []
    sections=[]

    current: null


    constructor: (@g) ->
        @data=JSON.parse(@g)
        @id=@data.id
        @turnCount=@data.numberOfTurns

        @players={}
        @allPlayers=[]
        @sections=[]

        @map=new Map(@data.map)
        @map.summary=this


        # init players
        for p,i in @data.players
            pid=p.id.slice(2,-2)
            xp=
                id: pid
                name: p.name
                state: p.state
                picks: []
                received: []
                starts: []
                intel: []
                bonusIncome: 0
                totalArmies: null
                mobileArmies: 0
                ownedTerrs: null
            @players[pid]=xp
            @allPlayers.push xp


        # read picks
        for k,p of @players
            pk="player_#{p.id}"
            for pick,j in @data.picks[pk]
                p.picks.push @map.terrs[pick]


        # post-distribution (standing0)
        for t in @data.standings[0]
            terr=@map.terrs[t.terrID]
            terr.armies=parseInt t.armies
            if t.ownedBy!='Neutral'
                player=@players[t.ownedBy]
                terr.owner=player
                player.starts.push terr
                pickIndex=player.picks.indexOf(terr)
                player.received.push pickIndex



        for k,p of @players
            p.received.sort()
            rcount=p.received.length
            if rcount>0
                for pick,i in p.picks
                    if (i not in p.received) and (i<p.received[rcount-1])
                        p.intel.push pick


        @sections=[]

        @current=new SummarySection()
        @current.header=
            turn: 0

        @current.notes.push '\n'
        for k,p of @players
            @current.notes.push "#{p.name} receives picks #{(x+1 for x in p.received).join(',')}\n"
            @current.notes.push "    starts in #{ ("#{x.bonus.name} (#{x.name})" for x in p.starts).join(', ')}\n"
            if p.intel.length>0
                @current.notes.push "    knows enemy is in #{ ("#{x.bonus.name} (#{x.name})" for x in p.intel).join(', ')}\n"
            else
                @current.notes.push "    has no intel on the enemy\n"

        @sections.push @current

        # process turns
        for turn,i in @data.turns

            # align standing
            for t in @data.standings[i]
                terr=@map.terrs[t.terrID]
                terr.armies=parseInt t.armies
                if t.ownedBy!='Neutral'
                    player=@players[t.ownedBy]
                    terr.owner=player
                else
                    terr.owner=null


            @current=new SummarySection()
            @sections.push @current
            @current.header=
                turn: i+1

            for o in turn.orders
                o.armies=parseInt o.armies
                o.defendingArmiesKilled=parseInt o.defendingArmiesKilled
                o.attackersKilled=parseInt o.attackersKilled


            for p in @allPlayers
                p.bonusIncome=(b.value for b in @map.allBonuses when b.getOwner()==p).sum()
                p.mobileArmies=((if x.armies>0 then x.armies-1 else 0) for x in @map.allTerrs when x.owner==p).sum()
                p.ownedTerrs=(x for x in @map.allTerrs when x.owner==p)
                @current.notes.push "  <<#{p.name} [bonus: #{p.bonusIncome}, mobile armies: #{p.mobileArmies}]>>"


            for o in turn.orders
                if o.type=='WarLight.Shared.GameOrderDeploy'
                    @map.terrs[o.deployOn].armies+=o.armies
                else if o.type=='WarLight.Shared.GameOrderAttackTransfer'
                    tfrom=@map.terrs[o.attackFrom]
                    tto=@map.terrs[o.attackTo]

                    # attack
                    if o.isAttack
                        @current.moves.push "#{tfrom.ownerName()} attacks #{tto.name} from #{tfrom.name}"
                        oldOwner=tto.owner
                        isKnockout=tto.owner and not (x for x in tto.connects when x.owner==tto.owner).length

                        if o.isSuccessful=='True'
                            if isKnockout
                                @current.events.push new Knockout(tto,tfrom.owner,oldOwner)

                            changed=tto.setOwner(tfrom.owner,@current)
                            if changed
                                if changed.oldOwner
                                    @current.events.push new Break(changed.bonus,tfrom,tfrom.owner,tto.owner)
                                    changed.oldOwner?.bonusIncome-=changed.bonus.value
                                if changed.newOwner
                                    @current.events.push new Capture(changed.bonus,tfrom.owner)
                                    changed.newOwner?.bonusIncome+=changed.bonus.value
                            else
                                zz=(x for x in @current.events when x instanceof Expand and x.player==tto.owner and x.bonus==tto.bonus)
                                console.log zz
                                if not zz.length and oldOwner is null
                                    @current.events.push new Expand(tto.bonus,tto.owner)
                            tto.armies=o.armies-o.attackersKilled
                            tfrom.armies-=o.armies
                        else
                            if isKnockout
                                @current.events.push new KnockoutFail(tto,tfrom.owner,oldOwner)
                            if tto.bonus.getOwner() and tto.bonus.getOwner()==tto.owner
                                @current.events.push new BreakFail(tto.bonus,tfrom,tfrom.owner,tto.owner)
                            tto.armies-=o.defendingArmiesKilled
                            tfrom.armies-=o.attackersKilled
                     else
                        if o.isSuccessful
                            tto.armies+=o.armies
                            tfrom.armies-=o.armies






        console.log "summary created: #{@id}"


    getText: () =>
        r=''
        if @data.state=='Finished'
            r="#{(x.name for x in @allPlayers when x.state=='Won').join(', ')} defeats #{(x.name for x in @allPlayers when x.state!='Won').join(', ')} in #{@turnCount} turns\n"
        else
            #r="#{(x.name for x in @allPlayers when x.state=='Won').join(', ')} defeats #{(x.name for x in @allPlayers when x.state!='Won').join(', ')} in #{@turncount} turns\n"
        r+="Game Link: https://www.warlight.net/MultiPlayer?GameID=#{@id}\n\n"

        r+=(x.getText() for x in @sections).join('\n')
        r

###
first entry to n


###

exports.Summary=Summary

class Capture
    constructor: (@bonus,@player)  ->

    getText: () =>
        "#{@player.name} CAPTURES #{@bonus.name} (+#{@bonus.value})\n"


class Break
    constructor: (@bonus,@from,@player,@defender)  ->

    getText: () =>
        "#{@player.name} BREAKS #{@bonus.name} from #{@from.name} (-#{@bonus.value})\n"


class BreakFail
    constructor: (@bonus,@from,@player,@defender)  ->

    getText: () =>
        "#{@player.name} attempts to break #{@bonus.name} from #{@from.name}, but fails\n"


class Expand
    constructor: (@bonus,@player)  ->

    getText: () =>
        "#{@player.name} expands in #{@bonus.name}\n"


class Knockout
    constructor: (@terr,@player,@defender)  ->

    getText: () =>
        "#{@player.name} takes #{@terr.name}, KNOCKING #{@defender.name} out of the area\n"


class KnockoutFail
    constructor: (@terr,@player,@defender)  ->

    getText: () =>
        "#{@player.name} attacks #{@terr.name}, attempting to knock #{@defender.name} out of the area, but fails\n"






class Terr
    id: null
    name: null
    bonus: null
    owner: null
    armies: null

    connects: null

    ownerName: () =>
        if this.owner then this.owner.name else '(neutral)'

    setOwner: (o,section) =>
        r=null
        if (o==@owner)
            return null
        if (@bonus)
            oldOwner=@bonus.getOwner()
            @owner=o
            newOwner=@bonus.getOwner()
            if newOwner!=oldOwner
                r=
                    bonus: @bonus
                    oldOwner: oldOwner
                    newOwner: newOwner
        else
            @owner=o
        r



class Bonus
    id: null
    name: null
    value: null
    terrs: []

    getOwner: () =>
        xo=@terrs[0].owner
        for t in @terrs
            if t.owner!=xo
                return null
        return xo

    addTerr: (t) =>
        #console.log "#{t.name} added to #{@name}"
        @terrs.push t



class Map
    summary: null
    name: null
    allTerrs:[]
    allBonuses: []

    terrs: {}
    bonuses: {}

    constructor: (@m) ->

        for b,i in @m.bonuses
            xb=new Bonus()
            xb.id=b.id
            xb.name=b.name
            xb.value=parseInt b.value
            xb.terrs=[]

            @allBonuses.push xb
            @bonuses[b.id]=xb


        for t,i in @m.territories

            xt=new Terr()
            xt.id=t.id
            xt.name=t.name
            xt.connects=[]

            @allTerrs.push xt
            @terrs[t.id]=xt

        for b,i in @m.bonuses
            for id in b.territoryIDs
                @terrs[id].bonus=@bonuses[b.id]
                #@bonuses[b.id].terrs.push @terrs[id]
                @bonuses[b.id].addTerr @terrs[id]

        for t,i in @m.territories
            for id in t.connectedTo
                @terrs[t.id].connects.push @terrs[id]





        for t,i in @terrs
            console.log "#{i} #{t.name} #{t.bonus.name}"


