import numpy as np
import cv2 as cv

font = cv.FONT_HERSHEY_SIMPLEX

def getCamera(num):
  camera = cv.VideoCapture(num)
  if not camera.isOpened():
    return None
  ret, frame = camera.read()
  if ret:
    return camera
  else:
    camera.release()
    return getCamera(num + 1)

global_dec_inf = None
def readQRCode(frame):
  qrImg = frame
  qrd = cv.QRCodeDetector()

  retval, decoded_info, points, straight_qrcode = qrd.detectAndDecodeMulti(frame)

  if retval:
    points = points.astype(np.int64)

    for dec_inf, point in zip(decoded_info, points):
      if dec_inf == '':
        continue

      if dec_inf != global_dec_inf:
        print('dec:', dec_inf)

      x = point[0][0]
      y = point[0][1]

      qrImg = cv.putText(qrImg, dec_inf, (x, y-6), font, .3, (0, 0, 255), 1, cv.LINE_AA)
      qrImg = cv.polylines(qrImg, [point], True, (0, 255, 0), 1, cv.LINE_AA)

  return qrImg

def main():
  cap = getCamera(0)
  if cap == None:
    exit()

  while True:
    ret, frame = cap.read()

    if not ret:
      print("Can't receive frame (stream end?). Exiting ...")
      break

    qrImg = readQRCode(frame)

    # gray = cv.cvtColor(frame, cv.COLOR_BGR2GRAY)

    cv.imshow('frame', qrImg)
    if cv.waitKey(1) == ord('q'):
      break

  cap.release()
  cv.destroyAllWindows()

main()