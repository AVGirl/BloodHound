import React, { Component } from 'react';
import NodeALink from './NodeALink'

export default class UserNodeData extends Component {
	propTypes: {
		visible : React.PropTypes.bool.isRequired
	}

	constructor(){
		super();

		this.state = {
			label: "",
			samAccountName: "None",
			displayName: "None",
			pwdLastChanged: "None",
			firstDegreeGroupMembership: -1,
			unrolledGroupMembership: -1,
			foreignGroupMembership: -1,
			firstDegreeLocalAdmin: -1,
			groupDelegatedLocalAdmin: -1,
			derivativeLocalAdmin: -1,
			sessions: -1
		}

		emitter.on('userNodeClicked', this.getNodeData.bind(this));
	}

	getNodeData(payload){
		this.setState({
			label: payload,
			samAccountName: "None",
			displayName: "None",
			pwdLastChanged: "None",
			firstDegreeGroupMembership: -1,
			unrolledGroupMembership: -1,
			foreignGroupMembership: -1,
			firstDegreeLocalAdmin: -1,
			groupDelegatedLocalAdmin: -1,
			derivativeLocalAdmin: -1,
			sessions: -1
		})

		var domain = '@' + payload.split('@').last()
		
		var s1 = driver.session()
		var s2 = driver.session()
		var s3 = driver.session()
		var s4 = driver.session()
		var s5 = driver.session()
		var s6 = driver.session()
		var s7 = driver.session()

		s1.run("MATCH (n:Group) WHERE NOT n.name ENDS WITH {domain} WITH n MATCH (m:User {name:{name}}) MATCH (m)-[r:MemberOf*1..]->(n) RETURN count(n)", {name:payload, domain: domain})
			.then(function(result){
				this.setState({'foreignGroupMembership':result.records[0]._fields[0].low})
				s1.close()
			}.bind(this))

		s2.run("MATCH (n:User {name:{name}}), (m:Group), p=(n)-[:MemberOf]->(m) RETURN count(m)", {name:payload})
			.then(function(result){
				this.setState({'firstDegreeGroupMembership':result.records[0]._fields[0].low})
				s2.close()
			}.bind(this))

		s3.run("MATCH p = (n:User {name:{name}})-[r:MemberOf*1..]->(g:Group) RETURN COUNT(DISTINCT(g))", {name:payload})
			.then(function(result){
				this.setState({'unrolledGroupMembership':result.records[0]._fields[0].low})
				s3.close()
			}.bind(this))

		s4.run("MATCH p = (n:User {name:{name}})-[r:AdminTo]->(c:Computer) RETURN COUNT(DISTINCT(c))", {name:payload})
			.then(function(result){
				this.setState({'firstDegreeLocalAdmin':result.records[0]._fields[0].low})
				s4.close()
			}.bind(this))

		s5.run("MATCH p=(n:User {name:{name}})-[r1:MemberOf*1..]->(g:Group)-[r2:AdminTo]->(c:Computer) RETURN count(distinct(c))", {name:payload})
			.then(function(result){
				this.setState({'groupDelegatedLocalAdmin':result.records[0]._fields[0].low})
				s5.close()
			}.bind(this))

		s6.run("MATCH p = shortestPath((n:User {name:{name}})-[r:HasSession|AdminTo|MemberOf*1..]->(c:Computer)) RETURN COUNT(c)", {name:payload})
			.then(function(result){
				this.setState({'derivativeLocalAdmin':result.records[0]._fields[0].low})
				s6.close()
			}.bind(this))

		s7.run("MATCH p = (n:Computer)-[r:HasSession]->(m:User {name:{name}}) RETURN COUNT(DISTINCT(n))", {name:payload})
			.then(function(result){
				this.setState({'sessions':result.records[0]._fields[0].low})
				s7.close()
			}.bind(this))
	}

	render() {
		var domain = '@' + this.state.label.split('@').last()
		return (
			<div className={this.props.visible ? "" : "displaynone"}>
				<dl className='dl-horizontal'>
					<dt>
						Node
					</dt>
					<dd>
						{this.state.label}
					</dd>
					<br />
					<dt>
						SAMAccountName
					</dt>
					<dd>
						{this.state.samAccountName}
					</dd>
					<dt>
						Display Name
					</dt>
					<dd>
						{this.state.displayName}
					</dd>
					<dt>
						Password Last Changed
					</dt>
					<dd>
						{this.state.pwdLastChanged}
					</dd>
					<br />
					<dt>
						First Degree Group Memberships
					</dt>
					<dd>
						<NodeALink 
							ready={this.state.firstDegreeGroupMembership !== -1}
							value={this.state.firstDegreeGroupMembership}
							click={function(){
								emitter.emit(
									'query',
									"MATCH p = (n:User {name:{name}})-[r:MemberOf]->(g:Group) RETURN p", {name:this.state.label}
									)
							}.bind(this)} />
					</dd>
					<dt>
						Unrolled Group Memberships
					</dt>
					<dd>
						<NodeALink
							ready={this.state.unrolledGroupMembership !== -1}
							value={this.state.unrolledGroupMembership}
							click={function(){
								emitter.emit('query', "MATCH p = (n:User {name:{name}})-[r:MemberOf*1..]->(g:Group) RETURN p", {name:this.state.label},
									this.state.label)
							}.bind(this)} />
					</dd>
					<dt>
						Foreign Group Membership
					</dt>
					<dd>
						<NodeALink
							ready={this.state.foreignGroupMembership !== -1}
							value={this.state.foreignGroupMembership}
							click={function(){
								emitter.emit('query', 
									"MATCH (n:Group) WHERE NOT n.name ENDS WITH {domain} WITH n MATCH (m:User {name:{name}}) WITH n,m MATCH p = (m)-[r:MemberOf*1..]->(n) RETURN p", {name: this.state.label, domain: domain})
							}.bind(this)} />
					</dd>
					<br />
					<dt>
						First Degree Local Admin
					</dt>
					<dd>
						<NodeALink
							ready={this.state.firstDegreeLocalAdmin !== -1}
							value={this.state.firstDegreeLocalAdmin}
							click={function(){
								emitter.emit('query', "MATCH p = (n:User {name:{name}})-[r:AdminTo]->(c:Computer) RETURN payload", {name:this.state.label})
							}.bind(this)} />
					</dd>
					<dt>
						Group Delegated Local Admin Rights
					</dt>
					<dd>
						<NodeALink
							ready={this.state.groupDelegatedLocalAdmin !== -1}
							value={this.state.groupDelegatedLocalAdmin}
							click={function(){
								emitter.emit('query', "MATCH p=(n:User {name:{name}})-[r1:MemberOf*1..]->(g:Group)-[r2:AdminTo]->(c:Computer) RETURN p", {name:this.state.label}
									,this.state.label)
							}.bind(this)} />
					</dd>
					<dt>
						Derivative Local Admin Rights
					</dt>
					<dd>
						<NodeALink
							ready={this.state.derivativeLocalAdmin !== -1}
							value={this.state.derivativeLocalAdmin}
							click={function(){	
								emitter.emit('query', "MATCH p = shortestPath((n:User {name:{name}})-[r:HasSession|AdminTo|MemberOf*1..]->(c:Computer)) RETURN p", {name:this.state.label}
									,this.state.label)
							}.bind(this)} />
					</dd>
					<dt>
						Sessions
					</dt>
					<dd>
						<NodeALink
							ready={this.state.sessions !== -1}
							value={this.state.sessions}
							click={function(){
								emitter.emit('query', "MATCH (n:Computer)-[r:HasSession]->(m:User {name:{name}}) RETURN n,r,m", {name:this.state.label}
									,this.state.label)
							}.bind(this)} />
					</dd>
				</dl>
			</div>
		);
	}
}