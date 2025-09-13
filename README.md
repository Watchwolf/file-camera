# README #

The component file-camera replace the classic <input type="file">. 

The problem with <input> is that the behavior is different on Android and iOS. On Android, there's no option to take a photo.

The component also allows you to add actions to the menu that allow you to perform other actions.

Feel free to copy it and modify it as your convenient.

I have created it in part of my projects : [[https://canicompet.com]([https://sonespacesante.fr/](https://sonespacesante.fr/))] and [https://canigps.fr](https://canigps.fr "https://canigps.fr")

### How do I get set up? ###

0.  Install Capacitor-Camera : [https://capacitorjs.com/docs/apis/camera](https://capacitorjs.com/docs/apis/camera "https://capacitorjs.com/docs/apis/camera")

1.  Clone the repository in your project
2.  Import the component in *.module.ts
```
import { FileCameraComponent } from './component/file-camera/file-camera.component';
@Component({
  selector: '...',
  templateUrl: './....html',
  styleUrls: ['./....scss'],
  imports: [FileCameraComponent],
  standalone: true,
})
```

3.  Use it in place of <input type="file">
```
<file-camera type="file" (ionChange)="onImageChange($event)" accept="image/*" [allowMultiple]="true" [maxFiles]="4 - images.length" #uploadImage/>

<ion-button fill="clear" (click)="uploadImage.click($event)">
  <ion-icon slot="icon-only" name="image"></ion-icon>
</ion-button>
```

4. Define the callback
```
onImageChange(fileChangeEvent: any) {
   var file = fileChangeEvent.target.files[0];
}
```

4. Parameters
```
  @Input() accept = "image/*,application/pdf"; //mime types user can select
  @Input() type = "file"; //type use with the HTML object <input>
  @Input() allowMultiple = false; //true to allow multiples files
  @Input() maxFiles = 1; //number of files allowed
  @Output() ionChange = new EventEmitter<any>(); //event emitted when the file is selected

  @Input() customActions: CustomAction[] = []  //add customs actions to the menu
  //example : this.customActions.push(new CustomAction(this.translate.instant('Add a pool'), () => this.addPool()))
```
