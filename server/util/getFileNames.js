const { exec } = require('child_process');

function getFileNames(path) {
  return new Promise((res, rej) => {
    const command = `find ${path} | grep 'jpg' | sort -r`;

    exec(
      command, 
      (err, stdout, stderr) => {
        if (err) return rej(err);
        if (stderr) return rej(stderr);

        const filenames = stdout.toString().split('\n');

        return res(filenames);
      }
    );
  });
}

module.exports = { getFileNames };
