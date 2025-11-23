[**unifi-protect**](README.md)

***

[Home](README.md) / ProtectLivestream

# ProtectLivestream

Access a direct MP4 livestream for a UniFi Protect camera.

The UniFi Protect livestream API is largely undocumented and has been reverse engineered mostly through
trial and error, as well as observing the Protect controller in action. It builds on the works of others in the
community - particularly https://github.com/XciD - who have experimented and successfully gotten parts of this API decoded.
As always, this work stands on the contributions of others and the work that's come before it, and I want to acknowledge those
that paved the way.

Let's start by defining some terms. In the MP4 world, an MP4 file (or stream) is composed of multiple atoms or segments.
Think of these as packet types that contain specific pieces of information that are needed to put together a valid MP4 file.
For our purposes, we're primarily interested in four types of MP4 boxes:

| Box   | Description                                                                                                                                   |
|-------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| FTYP  | File type box. This contains codec and file information for the stream that follows it. It must be at the beginning of any stream, and preceded by the FTYP box.      |
| MDAT  | Media data box. This contains a segment of the actual audio and video data in the MP4 stream. It is always paired with an MOOF box, which contains the metadata describing this payload in an MDAT box.        |
| MOOF  | Movie fragment box. This defines the metadata for a specific segment of audio and video. It is always paired with an MDAT box, which contains the actual data.        |
| MOOV  | Movie metadata box. This contains all the metadata information about the stream that follows. It must be at the beginning of any stream, and preceded by the FTYP box. The Protect livestream API actually combines the FTYP and MOOV boxes, conveniently giving us a complete initialization segment.        |

Every fMP4 stream begins with an initialization segment comprised of the FTYP and MOOV boxes. It defines the file type,
what the movie metadata is, and other characteristics. Think of it as the header for the entire stream.

After the header, every fMP4 stream has a series of segments (sometimes called fragments, hence the term fMP4),
that consist of a pair of moof / mdat boxes that includes all the audio and video for that segment. You end up with something
that looks like:

```
 |ftyp|moov|moof|mdat|moof|mdat...
```

The UniFi Protect livestream API provides a straightforward interface to generate bespoke fMP4 streams that
can be tailored depending on your needs. This implementation of the API allows you to access those streams, retrieve all the relevant boxes/atoms you need to
manipulate them for your application.

## Interfaces

### LivestreamOptions

Options for configuring a livestream session.

#### Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="chunksize"></a> `chunkSize` | `number` | Optionally specify the maximum payload size of each websocket packet. Larger sizes mean lower fragmentation. Defaults to 4096. |
| <a id="emittimestamps"></a> `emitTimestamps` | `boolean` | Optionally emit the decode timestamps of frames as timestamp events. This is the same information that appears in `tfdt` boxes. |
| <a id="lens"></a> `lens` | `number` | Optionally specify alternate cameras on a Protect device, such as a package camera. |
| <a id="requestid"></a> `requestId` | `string` | Optionally specify a request ID to the Protect controller. This is primarily used for logging purposes. |
| <a id="segmentlength"></a> `segmentLength` | `number` | Optionally specify the segment length, in milliseconds, of each fMP4 segment. Defaults to 100ms. |

## Events

### ProtectLivestream

This class provides a complete event-driven API to access the UniFi Protect Livestream API endpoint.

1. Create an instance of the [UniFi Protect API](ProtectApi.md#protectapi) to connect to the Protect controller.

2. Create an instance of [Protect Livestream](#protectlivestream) using the API instance above either directly, or through calling
[createLivestream](ProtectApi.md#createlivestream) method on an instance of [ProtectApi](ProtectApi.md#protectapi) (preferred).

3. Start a livestream using [start](#start), stop it with [stop](#stop), and listen for events.

3. Listen for `message` events emitted by [ProtectLivestream](#protectlivestream) which provides Buffers containing the raw fMP4 segment data as it's produced by Protect. You can
   alternatively listen individually for the initialization segment or regular fMP4 segments if you'd like to distinguish between the two types of segments.

Those are the basics that gets us up and running.

 close       - Emitted when the livestream WebSocket connection has been closed. This event fires after cleanup is complete and the connection is fully
                     terminated.
 codec       - Emitted when codec information is received from the controller. The codec string is passed as an argument in the format "codec,container"
                     (e.g., "hev1.1.6.L150,mp4a.40.2").
 initsegment - Emitted when an fMP4 initialization segment (FTYP and MOOV boxes) is received. The complete initialization segment Buffer is passed as an
                     argument.
 mdat        - Emitted when an MDAT box (media data) has been received as part of a segment. The MDAT Buffer is passed as an argument.
 message     - Emitted when any complete fMP4 segment is received, whether initialization or regular segment. The complete segment Buffer is passed as an
                     argument.
 moof        - Emitted when a MOOF box (movie fragment metadata) has been received as part of a segment. The MOOF Buffer is passed as an argument.
 segment     - Emitted when a non-initialization fMP4 segment (MOOF/MDAT pair) is fully assembled. The complete segment Buffer is passed as an argument.
 timestamps  - Emitted when decode timestamp information is received from the controller. An array of numbers containing the decode timestamps of frames in the
                     next segment is passed as an argument, mirroring the tfdt box contents.

#### Extends

- `EventEmitter`

#### Constructors

##### Constructor

```ts
new ProtectLivestream(api, log): ProtectLivestream;
```

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `api` | [`ProtectApi`](ProtectApi.md#protectapi) |
| `log` | [`ProtectLogging`](ProtectLogging.md#protectlogging) |

###### Returns

[`ProtectLivestream`](#protectlivestream)

###### Overrides

```ts
EventEmitter.constructor
```

#### Accessors

##### codec

###### Get Signature

```ts
get codec(): string;
```

The codecs in use for this livestream session.

###### Remarks

Codec information is provided as `codec,container` where codec is either `avc` (H.264) or `hev` (H.265). The container format is always `mp4`.

###### Example

```ts
`hev1.1.6.L150,mp4a.40.2`
```

###### Returns

`string`

Returns a string containing the codec information,if it exists, or `null` otherwise.

##### initSegment

###### Get Signature

```ts
get initSegment(): Nullable<Buffer<ArrayBufferLike>>;
```

The initialization segment that must be at the start of every fMP4 stream.

###### Returns

`Nullable`\<`Buffer`\<`ArrayBufferLike`\>\>

Returns the initialization segment if it exists, or `null` otherwise.

#### Methods

##### getInitSegment()

```ts
getInitSegment(): Promise<Buffer<ArrayBufferLike>>;
```

Retrieve the initialization segment that must be at the start of every fMP4 stream.

###### Returns

`Promise`\<`Buffer`\<`ArrayBufferLike`\>\>

Returns a promise that resolves once the initialization segment has been seen, or returning it immediately if it already has been.

##### stop()

```ts
stop(): void;
```

Stop an fMP4 livestream session from the Protect controller.

###### Returns

`void`

#### Events

##### start()

```ts
start(
   cameraId, 
   channel, 
options): Promise<boolean>;
```

Start an fMP4 livestream session from the Protect controller.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cameraId` | `string` | Protect camera device ID property from the camera's [ProtectCameraConfig](ProtectTypes.md#protectcameraconfiginterface). |
| `channel` | `number` | Camera channel to use, indexing the channels array in the camera's [ProtectCameraConfig](ProtectTypes.md#protectcameraconfiginterface). |
| `options` | `Partial`\<[`LivestreamOptions`](#livestreamoptions)\> | Optional parameters to further customize the livestream session. |

###### Returns

`Promise`\<`boolean`\>

Returns `true` if the livestream has successfully started, `false` otherwise.

 close       - Emitted when the livestream connection terminates for any reason, including manual stops or errors.
 codec       - Emitted with the codec information string when received from the controller (stream mode disabled only).
 initsegment - Emitted with the initialization segment Buffer containing FTYP and MOOV boxes (stream mode disabled only).
 message     - Emitted with each complete fMP4 segment Buffer, both initialization and regular segments (stream mode disabled only).
 segment     - Emitted with each complete non-initialization segment Buffer containing MOOF/MDAT pairs (stream mode disabled only).
 timestamps  - Emitted with decode timestamp arrays when extendedVideoMetadata is enabled in options.

###### Remarks

Once a livestream session has started, the following events can be listened for:

| Event         | Description                                                                                                                                  |
|---------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| `close`       | Livestream has been closed.                                                                                                                  |
| `codec`       | The codec and container format in use in the livestream. The codec information will be passed as an argument to any listeners.               |
| `initsegment` | An fMP4 initialization segment has been received. The segment will be passed as an argument to any listeners.                                |
| `message`     | An fMP4 segment has been received. No distinction is made between segment types. The segment will be passed as an argument to any listeners. |
| `segment`     | A non-initialization fMP4 segment has been received. The segment will be passed as an argument to any listeners.                             |
| `timestamps`  | An array of numbers containing the decode timestamps of the frames in the next segment. It mirrors what is provided in the `tfdt` box.       |

## Playing a livestream in Expo / React Native

`expo-av` is now deprecated. The maintained replacement is [`expo-video`](https://docs.expo.dev/versions/latest/sdk/video/), which ships with the same native
players (AVFoundation / ExoPlayer) but exposes a new API surface. More importantly, writing every fragment to disk quickly becomes a bottleneck when you need to
show multiple cameras or you are running on devices with minimal free storage. A more resilient solution is to stream the fragments from memory through a tiny
HTTP endpoint and let `expo-video` connect to `http://127.0.0.1`. This keeps storage usage near zero and still uses the native decoders.

### Overview of the in-memory chunk server approach

1. **Install dependencies** (requires a development build because we need native TCP sockets):

    ```bash
    npx expo install expo-video
    npx expo install react-native-tcp-socket
    ```

    `react-native-tcp-socket` exposes a minimal TCP server API we can use to serve HTTP chunked responses directly from memory. Make sure you rebuild the Expo dev
    client (`expo run:android` / `expo run:ios`).

2. **Start the Protect livestream** exactly as before:

    ```ts
    const api = new ProtectApi();
    await api.login("nvr.local", "username", "password");
    await api.getBootstrap();
    const livestream = api.createLivestream();
    await livestream.start(cameraId, 0, { requestId: "front-door" });
    ```

3. **Create a lightweight chunk server**. Each camera stream is identified by a key so that multiple `Video` components can subscribe independently. The server
    buffers only the latest initialization segment plus a handful of recent fragments, so storage stays constant regardless of how long the stream has been running:

    ```ts
   import EventEmitter from "eventemitter3";
   import TcpSocket from "react-native-tcp-socket";

    type Client = { id: string; socket: TcpSocket.Socket };

    class LivestreamChunkServer {
       private readonly clients = new Map<string, Set<Client>>();
       private readonly initSegments = new Map<string, Buffer>();
       private readonly server: TcpSocket.Server;

       constructor(port = 18530) {
          this.server = TcpSocket.createServer((socket) => this.handleSocket(socket));
          this.server.listen({ port, host: "127.0.0.1" });
       }

       dispose(): void {
          this.server.close();
          this.clients.clear();
          this.initSegments.clear();
       }

       registerStream(streamId: string, emitter: EventEmitter): void {
          const broadcast = (segment: Buffer): void => this.push(streamId, segment);
          emitter.on("initsegment", (segment: Buffer) => {
             this.initSegments.set(streamId, Buffer.from(segment));
             broadcast(segment);
          });
          emitter.on("segment", broadcast);
       }

       private handleSocket(socket: TcpSocket.Socket): void {
          socket.once("data", (data: Buffer) => {
             const requestLine = data.toString("ascii").split("\r\n")[0];
             const [, path] = requestLine.split(" ");
             const streamId = path?.slice(1) ?? "";
             this.addClient(streamId, socket);
          });
       }

       private addClient(streamId: string, socket: TcpSocket.Socket): void {
          const entry = this.clients.get(streamId) ?? new Set<Client>();
          entry.add({ id: socket.remoteAddress ?? Math.random().toString(), socket });
          this.clients.set(streamId, entry);

          socket.write([
             "HTTP/1.1 200 OK",
             "Content-Type: video/mp4",
             "Transfer-Encoding: chunked",
             "Connection: close",
             "\r\n"
          ].join("\r\n"));

          const init = this.initSegments.get(streamId);
          if(init) {
             this.writeChunk(socket, init);
          }

          socket.on("close", () => {
             for(const client of entry) {
                if(client.socket === socket) {
                   entry.delete(client);
                   break;
                }
             }
          });
       }

       private push(streamId: string, segment: Buffer): void {
          const clients = this.clients.get(streamId);
          if(!clients?.size) {
             return;
          }
          for(const client of clients) {
             this.writeChunk(client.socket, segment);
          }
       }

       private writeChunk(socket: TcpSocket.Socket, chunk: Buffer): void {
          const size = chunk.length.toString(16);
          socket.write(size + "\r\n");
          socket.write(chunk);
          socket.write("\r\n");
       }
    }
    ```

4. **Wire the livestream into the server**:

    ```ts
    const chunkServer = new LivestreamChunkServer();
    chunkServer.registerStream("front-door", livestream);
    ```

5. **Render with `expo-video`**. Each player instance points at a different local URL (one per camera). Because the transport is HTTP chunked transfer, ExoPlayer
    and AVFoundation treat it as a never-ending MP4 file without ever touching disk:

    ```tsx
    import { VideoView } from "expo-video";

    function CameraTile({ streamId }: { streamId: string }): JSX.Element {
       return (
          <VideoView
             style={{ width: "100%", aspectRatio: 16 / 9 }}
             source={{ uri: `http://127.0.0.1:18530/${streamId}` }}
             nativeControls={false}
             shouldPlay
             isLooping
             resizeMode="contain"
          />
       );
    }
    ```

6. **Cleanup**: stop the livestream and close any sockets when the screen unmounts to avoid dangling listeners:

    ```ts
    return () => {
       livestream.stop();
       chunkServer.dispose?.();
    };
    ```

### Why this scales better than temporary files

- **No persistent writes**: fragments exist only in memory and are discarded once sent to the clients. Low-storage devices and multi-camera grids no longer risk
   running out of disk.
- **Instant multi-view**: every `<VideoView>` subscribes to the same stream ID, so a single camera feed can power multiple tiles without duplicating storage or
   connection overhead.
- **Graceful recovery**: when a player reconnects it immediately receives the cached initialization segment followed by the most recent data, keeping playback in
   sync.

You can still fall back to the file-based approach for rapid prototyping, but the chunk-server flow above is the recommended long-term solution for Expo projects.
