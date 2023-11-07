interface PlaylistObject {
  [key: string]: {
    name: string;
    url: string;
  };
}

interface EPGObject {
  [Object: string]: {
    channels: Array<Object>;
    programmes: Array<Object>;
    generatorInfoName: string;
  }
}

type validPlayers = "mpv" | "vlc";

type mpvHWDecodingTypes =
  | "no"
  | "auto-safe"
  | "auto"
  | "yes"
  | "auto-copy"
  | "d3d11va"
  | "d3d11va-copy"
  | "videotoolbox"
  | "videotoolbox-copy"
  | "vaapi"
  | "vaapi-copy"
  | "nvdec"
  | "nvdec-copy"
  | "drm"
  | "drm-copy"
  | "vulkan"
  | "vulkan-copy"
  | "dxva2"
  | "dxva2-copy"
  | "vdpau"
  | "vdpau-copy"
  | "mediacodec"
  | "mediacodec-copy"
  | "mmal"
  | "mmal-copy"
  | "cuda"
  | "cuda-copy"
  | "crystalhd"
  | "rkmpp";

export { PlaylistObject, validPlayers, mpvHWDecodingTypes, EPGObject };
