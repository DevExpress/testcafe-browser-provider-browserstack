export default function (envVar) {
    return process.env[envVar] && process.env[envVar] !== '0';
}
