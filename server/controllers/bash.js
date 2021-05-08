const { exec } = require('child_process');

const runBashCommand = {
  method: 'post',
  pattern: '/api/bash',
  handler: (req, res) => {
    console.log(req.body);
    
    const { body: { command } } = req;
    
    if (!command) {
      res.status(400);
      return res.send('Missing command');
    }
    
    exec(command, (err, stdout, stderr) => {
      if (stderr) {
        res.status(500);
        return res.send(stderr);
      }
      
      return res.send(stdout);
    });
  },
};

module.exports = { routes: [runBashCommand] };
