import { ZipWriter, TextReader, BlobWriter } from '@zip.js/zip.js';
import chroma from 'chroma-js';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

// Helper to convert a Blob object to a Base64 string (needed for Expo FileSystem on mobile)
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject; // Handle potential read errors
    reader.onloadend = () => {
      // reader.result contains the Data URL: "data:mime/type;base64,BASE64_STRING"
      const dataUrl = reader.result as string;
      // Extract just the Base64 part after the comma
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    // Start reading the Blob as a Data URL
    reader.readAsDataURL(blob);
  });
}

// Interface defining the structure of a single color within the Procreate swatches JSON
interface ProcreateColor {
  alpha: number; // Alpha value (0-1, typically 1 for solid colors)
  origin: number; // Origin identifier (seems to be 1 usually)
  colorSpace: number; // Color space identifier (0 for sRGB in this case)
  colorModel: number; // Color model identifier (0 for HSB in this case)
  brightness: number; // Brightness component (V from HSV, 0-1)
  components: number[]; // Color components [Hue/360, Saturation, Brightness] (all 0-1)
  version: string; // Procreate version string (e.g., "5.0")
  colorProfile: string; // Hash referencing the embedded color profile
  saturation: number; // Saturation component (S from HSV, 0-1)
  hue: number; // Hue component (H from HSV, normalized 0-1)
}

/**
 * Exports an array of hex colors as a Procreate .swatches file.
 * A .swatches file is actually a ZIP archive containing a JSON file.
 *
 * @param hexColors - Array of hex color strings (e.g., "#FF0000"). Max 30 colors supported by Procreate swatches.
 * @param filename - Optional desired filename (defaults to 'Exported Swatch.swatches').
 */
export async function exportProcreateSwatch(
  hexColors: string[],
  filename: string = 'Exported Swatch.swatches',
): Promise<void> {
  // Ensure filename ends with .swatches
  const exportFileName = filename.endsWith('.swatches') ? filename : `${filename}.swatches`;

  // Procreate swatch files have a fixed size of 30 colors per palette.
  const MAX_SWATCHES = 30;

  // 1. Convert hex colors to the ProcreateColor structure
  const swatches: (ProcreateColor | null)[] = hexColors
    .slice(0, MAX_SWATCHES) // Take only the first 30 colors if more are provided
    .map((hex) => {
      // Get HSV values from chroma-js: h(0-360), s(0-1), v(0-1)
      const [h, s, v] = chroma(hex).hsv();
      // Handle potential NaN hue for black/white/grey (chroma-js might return NaN)
      const normalizedHue = isNaN(h) ? 0 : h / 360;

      return {
        alpha: 1, // Solid color
        origin: 1, // Standard value
        colorSpace: 0, // 0 = sRGB
        colorModel: 0, // 0 = HSB
        brightness: v, // Value/Brightness component (0-1)
        components: [normalizedHue, s, v], // HSB components, normalized (0-1)
        version: '5.0', // Corresponds to Procreate 5.x+ format
        // This specific hash corresponds to the embedded sRGB profile below
        colorProfile: 'IHif2+qYNSUaTweWyL9Fy9lkiWBEiGVA2iH/x0V68Ks=',
        saturation: s, // Saturation component (0-1)
        hue: normalizedHue, // Hue component, normalized (0-1)
      };
    });

  // 2. Pad the array with nulls to reach the required 30 items
  while (swatches.length < MAX_SWATCHES) {
    swatches.push(null); // Procreate uses null for empty slots
  }

  // 3. Define the content for the JSON file inside the zip
  // Includes the swatches array and the embedded sRGB color profile data (as Base64)
  const jsonContent = JSON.stringify(
    {
      name: filename.replace('.swatches', ''), // Use the filename (without extension) as swatch name
      swatches,
      // Embedded sRGB IEC61966-2.1 color profile data (obtained from a Procreate-generated file)
      colorProfiles: [
        {
          colorSpace: 0, // Matches the colorSpace used in swatches
          hash: 'IHif2+qYNSUaTweWyL9Fy9lkiWBEiGVA2iH/x0V68Ks=', // Unique ID for this profile
          // Base64 encoded ICC profile data for sRGB IEC61966-2.1
          iccData:
            'AAAMSExpbm8CEAAAbW50clJHQiBYWVogB84AAgAJAAYAMQAAYWNzcE1TRlQAAAAASUVDIHNSR0IA\r\nAAAAAAAAAAAAAAAAAPbWAAEAAAAA0y1IUCAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\r\nAAAAAAAAAAAAAAAAAAAAAAARY3BydAAAAVAAAAAzZGVzYwAAAYQAAABsd3RwdAAAAfAAAAAUYmtw\r\ndAAAAgQAAAAUclhZWgAAAhgAAAAUZ1hZWgAAAiwAAAAUYlhZWgAAAkAAAAAUZG1uZAAAAlQAAABw\r\nZG1kZAAAAsQAAACIdnVlZAAAA0wAAACGdmlldwAAA9QAAAAkbHVtaQAAA\/gAAAAUbWVhcwAABAwA\r\nAAAkdGVjaAAABDAAAAAMclRSQwAABDwAAAgMZ1RSQwAABDwAAAgMYlRSQwAABDwAAAgMdGV4dAAA\r\nAABDb3B5cmlnaHQgKGMpIDE5OTggSGV3bGV0dC1QYWNrYXJkIENvbXBhbnkAAGRlc2MAAAAAAAAA\r\nEnNSR0IgSUVDNjE5NjYtMi4xAAAAAAAAAAAAAAASc1JHQiBJRUM2MTk2Ni0yLjEAAAAAAAAAAAAA\r\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAADzUQABAAAA\r\nARbMWFlaIAAAAAAAAAAAAAAAAAAAAABYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAA\r\nt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9kZXNjAAAAAAAAABZJRUMgaHR0cDovL3d3dy5pZWMu\r\nY2gAAAAAAAAAAAAAABZJRUMgaHR0cDovL3d3dy5pZWMuY2gAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\r\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZGVzYwAAAAAAAAAuSUVDIDYxOTY2LTIuMSBEZWZhdWx0\r\nIFJHQiBjb2xvdXIgc3BhY2UgLSBzUkdCAAAAAAAAAAAAAAAuSUVDIDYxOTY2LTIuMSBEZWZhdWx0\r\nIFJHQiBjb2xvdXIgc3BhY2UgLSBzUkdCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGRlc2MAAAAAAAAA\r\nLFJlZmVyZW5jZSBWaWV3aW5nIENvbmRpdGlvbiBpbiBJRUM2MTk2Ni0yLjEAAAAAAAAAAAAAACxS\r\nZWZlcmVuY2UgVmlld2luZyBDb25kaXRpb24gaW4gSUVDNjE5NjYtMi4xAAAAAAAAAAAAAAAAAAAA\r\nAAAAAAAAAAAAAAB2aWV3AAAAAAATpP4AFF8uABDPFAAD7cwABBMLAANcngAAAAFYWVogAAAAAABM\r\nCVYAUAAAAFcf521lYXMAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAKPAAAAAnNpZyAAAAAAQ1JU\r\nIGN1cnYAAAAAAAAEAAAAAAUACgAPABQAGQAeACMAKAAtADIANwA7AEAARQBKAE8AVABZAF4AYwBo\r\nAG0AcgB3AHwAgQCGAIsAkACVAJoAnwCkAKkArgCyALcAvADBAMYAywDQANUA2wDgAOUA6wDwAPYA\r\n+wEBAQcBDQETARkBHwElASsBMgE4AT4BRQFMAVIBWQFgAWcBbgF1AXwBgwGLAZIBmgGhAakBsQG5\r\nAcEByQHRAdkB4QHpAfIB+gIDAgwCFAIdAiYCLwI4AkECSwJUAl0CZwJxAnoChAKOApgCogKsArYC\r\nwQLLAtUC4ALrAvUDAAMLAxYDIQMtAzgDQwNPA1oDZgNyA34DigOWA6IDrgO6A8cD0wPgA+wD+QQG\r\nBBMEIAQtBDsESARVBGMEcQR+BIwEmgSoBLYExATTBOEE8AT+BQ0FHAUrBToFSQVYBWcFdwWGBZYF\r\npgW1BcUF1QXlBfYGBgYWBicGNwZIBlkGagZ7BowGnQavBsAG0QbjBvUHBwcZBysHPQdPB2EHdAeG\r\nB5kHrAe\/B9IH5Qf4CAsIHwgyCEYIWghuCIIIlgiqCL4I0gjnCPsJEAklCToJTwlkCXkJjwmkCboJ\r\nzwnlCfsKEQonCj0KVApqCoEKmAquCsUK3ArzCwsLIgs5C1ELaQuAC5gLsAvIC+EL+QwSDCoMQwxc\r\nDHUMjgynDMAM2QzzDQ0NJg1ADVoNdA2ODakNww3eDfgOEw4uDkkOZA5\/DpsOtg7SDu4PCQ8lD0EP\r\nXg96D5YPsw\/PD+wQCRAmEEMQYRB+EJsQuRDXEPURExExEU8RbRGMEaoRyRHoEgcSJhJFEmQShBKj\r\nEsMS4xMDEyMTQxNjE4MTpBPFE+UUBhQnFEkUahSLFK0UzhTwFRIVNBVWFXgVmxW9FeAWAxYmFkkW\r\nbBaPFrIW1hb6Fx0XQRdlF4kXrhfSF\/cYGxhAGGUYihivGNUY+hkgGUUZaxmRGbcZ3RoEGioaURp3\r\nGp4axRrsGxQbOxtjG4obshvaHAIcKhxSHHscoxzMHPUdHh1HHXAdmR3DHeweFh5AHmoelB6+Hukf\r\nEx8+H2kflB+\/H+ogFSBBIGwgmCDEIPAhHCFIIXUhoSHOIfsiJyJVIoIiryLdIwojOCNmI5QjwiPw\r\nJB8kTSR8JKsk2iUJJTglaCWXJccl9yYnJlcmhya3JugnGCdJJ3onqyfcKA0oPyhxKKIo1CkGKTgp\r\naymdKdAqAio1KmgqmyrPKwIrNitpK50r0SwFLDksbiyiLNctDC1BLXYtqy3hLhYuTC6CLrcu7i8k\r\nL1ovkS\/HL\/4wNTBsMKQw2zESMUoxgjG6MfIyKjJjMpsy1DMNM0YzfzO4M\/E0KzRlNJ402DUTNU01\r\nhzXCNf02NzZyNq426TckN2A3nDfXOBQ4UDiMOMg5BTlCOX85vDn5OjY6dDqyOu87LTtrO6o76Dwn\r\nPGU8pDzjPSI9YT2hPeA+ID5gPqA+4D8hP2E\/oj\/iQCNAZECmQOdBKUFqQaxB7kIwQnJCtUL3QzpD\r\nfUPARANER0SKRM5FEkVVRZpF3kYiRmdGq0bwRzVHe0fASAVIS0iRSNdJHUljSalJ8Eo3Sn1KxEsM\r\nS1NLmkviTCpMcky6TQJNSk2TTdxOJU5uTrdPAE9JT5NP3VAnUHFQu1EGUVBRm1HmUjFSfFLHUxNT\r\nX1OqU\/ZUQlSPVNtVKFV1VcJWD1ZcVqlW91dEV5JX4FgvWH1Yy1kaWWlZuFoHWlZaplr1W0VblVvl\r\nXDVchlzWXSddeF3JXhpebF69Xw9fYV+zYAVgV2CqYPxhT2GiYfViSWKcYvBjQ2OXY+tkQGSUZOll\r\nPWWSZedmPWaSZuhnPWeTZ+loP2iWaOxpQ2maafFqSGqfavdrT2una\/9sV2yvbQhtYG25bhJua27E\r\nbx5veG\/RcCtwhnDgcTpxlXHwcktypnMBc11zuHQUdHB0zHUodYV14XY+dpt2+HdWd7N4EXhueMx5\r\nKnmJeed6RnqlewR7Y3vCfCF8gXzhfUF9oX4BfmJ+wn8jf4R\/5YBHgKiBCoFrgc2CMIKSgvSDV4O6\r\nhB2EgITjhUeFq4YOhnKG14c7h5+IBIhpiM6JM4mZif6KZIrKizCLlov8jGOMyo0xjZiN\/45mjs6P\r\nNo+ekAaQbpDWkT+RqJIRknqS45NNk7aUIJSKlPSVX5XJljSWn5cKl3WX4JhMmLiZJJmQmfyaaJrV\r\nm0Kbr5wcnImc951kndKeQJ6unx2fi5\/6oGmg2KFHobaiJqKWowajdqPmpFakx6U4pammGqaLpv2n\r\nbqfgqFKoxKk3qamqHKqPqwKrdavprFys0K1ErbiuLa6hrxavi7AAsHWw6rFgsdayS7LCszizrrQl\r\ntJy1E7WKtgG2ebbwt2i34LhZuNG5SrnCuju6tbsuu6e8IbybvRW9j74KvoS+\/796v\/XAcMDswWfB\r\n48JfwtvDWMPUxFHEzsVLxcjGRsbDx0HHv8g9yLzJOsm5yjjKt8s2y7bMNcy1zTXNtc42zrbPN8+4\r\n0DnQutE80b7SP9LB00TTxtRJ1MvVTtXR1lXW2Ndc1+DYZNjo2WzZ8dp22vvbgNwF3IrdEN2W3hze\r\nIot8p36\/gNuC94UThzOJT4tvjY+Pr5HPk\/OWE5g3mlucf56noMui86Ubp0Opb6uXrcOv77IbtEe2c\r\n7ijutO9A78zwWPDl8XLx\/\/KM8xnzp\/Q09ML1UPXe9m32+\/eK+Bn4qPk4+cf6V\/rn+3f8B\/yY\/Sn9\r\nuv5L\/tz\/bf\/\/',
          iccName: 'sRGB IEC61966-2.1', // Human-readable name of the profile
        },
      ],
    },
    null, // Use null for replacer function (default behavior)
    2, // Indent with 2 spaces for readability (optional)
  );

  // 4. Create the ZIP archive
  const jsonFileName = 'Swatches.json'; // Standard internal filename for Procreate
  const blobWriter = new BlobWriter('application/zip'); // Specify ZIP MIME type
  const zipWriter = new ZipWriter(blobWriter);

  // Add the JSON content as a file named "Swatches.json" inside the zip
  await zipWriter.add(jsonFileName, new TextReader(jsonContent));

  // Finalize the zip and get the Blob result
  const zipBlob = await zipWriter.close();

  // 5. Handle file saving/sharing based on platform
  if (Platform.OS !== 'web') {
    // Mobile (iOS/Android)
    try {
      // Convert the zip Blob to base64 for Expo FileSystem
      const base64Zip = await blobToBase64(zipBlob);
      const fileUri = FileSystem.documentDirectory + exportFileName;
      await FileSystem.writeAsStringAsync(fileUri, base64Zip, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log(`Procreate swatch file saved to: ${fileUri}`);

      // Use Expo Sharing to open the share sheet
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/octet-stream',
          dialogTitle: 'Share Procreate Swatch',
        }); // Use generic binary type
      } else {
        alert('Sharing is not available on this device.');
      }
    } catch (error) {
      console.error('Error exporting Procreate swatch on mobile:', error);
      alert(`Error exporting swatch: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    // Web - Trigger download using a Blob URL
    try {
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting Procreate swatch on web:', error);
      alert(`Error exporting swatch: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
