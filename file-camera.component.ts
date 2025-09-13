import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { IonSelect, AlertController, Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { FilePicker } from '@capawesome/capacitor-file-picker';

// Convert a base64 string to a file object
function dataURLtoFile(dataurl: string, filename: string) {
  var arr = dataurl.split(',')
  var mime: any = arr[0].match(/:(.*?);/)?[1]: null
  var bstr = atob(arr[arr.length - 1])
  var n = bstr.length
  var u8arr = new Uint8Array(n)

  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, {type:mime});
}

export class CustomAction {
  label: string = ''
  event: EventEmitter<any> = new EventEmitter<any>()

  constructor(label: string, callback: (data?: any) => void) {
    this.label = label
    this.event.subscribe(callback)
  }
}

@Component({
  selector: 'file-camera',
  templateUrl: './file-camera.component.html',
  styleUrls: ['./file-camera.component.scss'],
  imports: [CommonModule, IonicModule, TranslateModule],
  standalone: true,
})
export class FileCameraComponent  implements OnInit {
  @ViewChild('inputFile') inputFile!: ElementRef;
  @ViewChild('selectOption') selectOption!: IonSelect;

  @Input() accept = "image/*,application/pdf";
  @Input() type = "file";
  @Input() allowMultiple = false;
  @Input() maxFiles = 1;
  @Output() ionChange = new EventEmitter<any>();
  @Input() customActions: CustomAction[] = [] 

  isCameraAvailable = false
  isGalleryAvailable = false
  latestInputEvent: any = null

  constructor(
    private translate: TranslateService,
    public alertController: AlertController,
    private platform: Platform) { }

  async ngOnInit() {
    if(this.platform.is('android') || this.platform.is('ios')) {
      this.isGalleryAvailable = true;
    } else {
      this.isGalleryAvailable = false;
    }

    if(!this.platform.is('mobileweb') && (this.platform.is('android') || this.platform.is('ios'))) {
      const permissions = await Camera.requestPermissions();
      if(permissions.camera === 'denied') {
        this.isCameraAvailable = false;
      } else {
        this.isCameraAvailable = true;
      }
    } else if(this.platform.is('mobileweb')) {
      this.isCameraAvailable = true;
    }

    //Filepicker does not work on iOS web, so we disable the options
    if(this.platform.is('mobileweb') && this.platform.is('ios')) {
      this.isCameraAvailable = false;
      this.isGalleryAvailable = false;
    }

    await FilePicker.checkPermissions();
  }

  //When the input file changes, we emit the event
  async onInputFileChange(event:any) {
    this.latestInputEvent = event;
    if(event.target.files.length > this.maxFiles) {
      var alert = await this.alertController.create({
        header: this.translate.instant("Warning"),
        subHeader: this.translate.instant("Too many files"),
        message: this.translate.instant("You can only select up to {{maxFiles}} files.", { maxFiles: this.maxFiles }),
        buttons: ['OK'],
      });
      await alert.present();
      return
    }

    for(let file of event.target.files) {
      if(file.size / 1000 / 1000 > 20) {
        var alert = await this.alertController.create({
          header: this.translate.instant("Warning"),
          subHeader: this.translate.instant("File too large"),
          message: this.translate.instant("The file is larger than 20MB, it is too large to be selected."),
          buttons: ['OK'],
        });
        await alert.present();
        return
      }
    }
    
    this.ionChange.emit(event);
  }

  click(event: any) {
    if(!this.isCameraAvailable && !this.isGalleryAvailable && this.customActions.length == 0)
      this.inputFile.nativeElement.click();
    else {
      this.selectOption.value = undefined;
      this.selectOption.open(event);
    }

    //Set the previous input event to null to allow the user to re-select the same file
    if(this.latestInputEvent != null)
      this.latestInputEvent.target.value = null;
  }

  async selectOptionCB(event: any) {
    if(event.detail.value == undefined)
      return 

    if(event.detail.value.event) {
      event.detail.value.event.emit()
    } else if(!this.isCameraAvailable && !this.isGalleryAvailable) {
      this.inputFile.nativeElement.click();
    } else if(event.detail.value == 'file') {
      const result = await FilePicker.pickFiles({limit: 1, readData: true, types: this.accept.replace('image/*', 'image/png,image/jpeg,image/heif,image/tiff').split(',')});
      const file = result.files[0];
      if (file.data) {
        //Simulate <input> event
        const rawFile = dataURLtoFile(file.data ?? '', file.name)
        const _event = { target: { files: [rawFile]}}
        this.ionChange.emit(_event);
      }
    }
    else if(event.detail.value == 'camera') {
      const image = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.DataUrl,
        allowEditing: false,
        source: CameraSource.Camera,
      });

      //Simulate <input> event
      const _event = { target: { files: [dataURLtoFile(image.dataUrl ?? '', 'file.' + image.format)]}}
      this.ionChange.emit(_event);
    }
    else if(event.detail.value == 'gallery') {
      const result = await FilePicker.pickImages({limit: this.allowMultiple ? this.maxFiles : 1, ordered: true, skipTranscoding: false, readData: true});

      const _event: any = { target: { files: []}}

      for(let file of result.files) {
        if (file.data) {
          const rawFile = dataURLtoFile(file.data ?? '', file.name)
          _event.target.files.push(rawFile);
        }
      }

      //Simulate <input> event
      if(_event.target.files.length > 0)
        this.ionChange.emit(_event);
    }
  }
}
