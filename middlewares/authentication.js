var Auth = 
{ 
	is_login: function (req, res, next) 
	{ 		
		if (false && !req.session.is_login) 
		{ 
			return res.redirect('/login'); 
		} 
		next(); 
	},
}; 
module.exports = Auth;